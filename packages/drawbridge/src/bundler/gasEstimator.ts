import { BundlerRpcSchema, Transport, Hex } from "viem"
import { formatUserOperationRequest } from "viem/account-abstraction"
import {
  logGasEstimatorRpcMethod,
  logSmartAccountUnwrap,
  logSmartAccountUnwrapResult,
  logMudCallFromUnwrap,
  logMudCallFromUnwrapResult,
  logGasEstimateBreakdown,
  logNoCustomGasEstimates,
  logNoMeasurementForSelector,
  logGasEstimatorError,
  logCallGasLimitComparison
} from "./tempDebugLogging"

/**
 * Gas estimation configuration for user operations
 * Maps function selectors (4-byte hex) to gas limits
 */
export type GasEstimates = {
  [selector: string]: bigint
}

/**
 * Response from eth_estimateUserOperationGas RPC call
 * All fields are returned as hex strings from the bundler
 */
type UserOperationGasEstimate = {
  callGasLimit: Hex
  verificationGasLimit: Hex
  preVerificationGas: Hex
  paymasterVerificationGasLimit?: Hex
  paymasterPostOpGasLimit?: Hex
}

/**
 * Extract function selector from callData
 * Handles smart account execute wrapper and MUD callFrom wrapper
 */
function extractFunctionSelector(callData: Hex): string | null {
  if (!callData || callData.length < 10) return null

  let data = callData

  // Smart account's execute(address,uint256,bytes) wrapper (0xb61d27f6)
  // Structure: selector(4) + target(32) + value(32) + dataOffset(32) + dataLength(32) + actualData
  if (data.startsWith("0xb61d27f6")) {
    logSmartAccountUnwrap()
    // Skip: "0x" + selector(8) + target(64) + value(64) + offset(64) + length(64) = 266 chars
    const offset = 2 + 8 + 64 + 64 + 64 + 64
    if (data.length > offset) {
      data = ("0x" + data.slice(offset)) as Hex
      logSmartAccountUnwrapResult(data.slice(0, 10))
    }
  }

  // MUD's callFrom wraps the actual call (0xdd2bcbae)
  // Structure: selector(4) + delegator(32) + systemId(32) + offset(32) + length(32) + actualCallData
  if (data.startsWith("0xdd2bcbae")) {
    logMudCallFromUnwrap()
    const offset = 2 + 8 + 64 + 64 + 64 + 64
    if (data.length > offset + 8) {
      data = data.slice(offset, offset + 10) as Hex
      logMudCallFromUnwrapResult(data)
      return data
    }
  }

  // Direct call - first 4 bytes (8 hex chars after 0x)
  return data.slice(0, 10) as Hex
}

/**
 * Gas estimator transport wrapper
 * Intercepts eth_estimateUserOperationGas RPC calls and returns precise estimates
 * based on provided gas measurements
 *
 * @param gasEstimates Optional map of function selectors to gas limits
 * @param getTransport The transport to wrap
 */
export function gasEstimator<const transport extends Transport>(
  gasEstimates: GasEstimates | undefined,
  getTransport: transport
): transport {
  return ((opts: any) => {
    const { request: originalRequest, ...rest } = getTransport(opts)

    const request = async ({ method, params }: any, options?: any) => {
      logGasEstimatorRpcMethod(method)

      if (method === "eth_estimateUserOperationGas") {
        const [userOp] = params
        const selector = extractFunctionSelector(userOp.callData)
        const measuredGas = selector && gasEstimates ? gasEstimates[selector] : null

        if (measuredGas) {
          // First, get viem's default estimation for the other gas fields
          let defaultEstimate: UserOperationGasEstimate
          try {
            defaultEstimate = await originalRequest({ method, params }, options)
          } catch (error) {
            logGasEstimatorError(error)
            throw error
          }

          // Log comparison between bundler's default and our measured value
          const bundlerDefaultCallGas = BigInt(defaultEstimate.callGasLimit)
          logCallGasLimitComparison({
            selector,
            bundlerDefault: bundlerDefaultCallGas,
            measured: measuredGas
          })

          // Override only callGasLimit with our measured value
          // Convert hex strings to BigInt for other fields
          // Use safe defaults if bundler doesn't provide paymaster gas values
          const estimate = {
            callGasLimit: measuredGas,
            verificationGasLimit: BigInt(defaultEstimate.verificationGasLimit),
            preVerificationGas: BigInt(defaultEstimate.preVerificationGas),
            paymasterVerificationGasLimit: BigInt(
              defaultEstimate.paymasterVerificationGasLimit || "0x6978"
            ), // 27000 default
            paymasterPostOpGasLimit: BigInt(defaultEstimate.paymasterPostOpGasLimit || "0x6978") // 27000 default
          }

          const totalGas =
            estimate.callGasLimit +
            estimate.verificationGasLimit +
            estimate.preVerificationGas +
            estimate.paymasterVerificationGasLimit +
            estimate.paymasterPostOpGasLimit

          // Try to get gas price from the user operation if available
          const maxFeePerGas = userOp.maxFeePerGas ? BigInt(userOp.maxFeePerGas) : null
          const gasPrice = maxFeePerGas ? Number(maxFeePerGas) / 1e9 : null // Convert to gwei

          logGasEstimateBreakdown({
            selector,
            callGasLimit: estimate.callGasLimit,
            verificationGasLimit: estimate.verificationGasLimit,
            preVerificationGas: estimate.preVerificationGas,
            paymasterVerificationGasLimit: estimate.paymasterVerificationGasLimit,
            paymasterPostOpGasLimit: estimate.paymasterPostOpGasLimit,
            totalGas,
            gasPrice
          })

          return formatUserOperationRequest(estimate)
        }

        if (!gasEstimates) {
          logNoCustomGasEstimates()
        } else {
          logNoMeasurementForSelector(selector)
        }
      }

      return originalRequest({ method, params }, options)
    }

    return { request, ...rest }
  }) as transport
}
