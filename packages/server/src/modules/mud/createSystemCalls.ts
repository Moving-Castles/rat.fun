/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { Hex, parseGwei, BaseError, ContractFunctionRevertedError } from "viem"
import { OutcomeReturnValue } from "@modules/types"
import { SetupNetworkResult } from "./setupNetwork"
import { Rat, Trip } from "@modules/types"
import { getEnterTripData } from "@modules/mud/getOnchainData/getEnterTripData"
import { createOutcomeCallArgs, updateOutcome, validateOutcome } from "./outcome"
import { getTripValue, getRatValue } from "./value"
import {
  SystemCallError,
  ContractCallError,
  OutcomeUpdateError
} from "@modules/error-handling/errors"
import { TripLogger } from "@modules/logging"

export type SystemCalls = ReturnType<typeof createSystemCalls>

/**
 * Extract revert reason from viem errors
 */
function extractRevertReason(error: unknown): string {
  if (error instanceof BaseError) {
    // Check for ContractFunctionRevertedError which contains the revert reason
    const revertError = error.walk(err => err instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName
      const args = revertError.data?.args
      if (errorName) {
        return `${errorName}${args ? `(${JSON.stringify(args)})` : ""}`
      }
      // Try to get the reason from the error message
      if (revertError.reason) {
        return revertError.reason
      }
    }
    // Try to extract from shortMessage or message
    if (error.shortMessage) {
      return error.shortMessage
    }
  }
  if (error instanceof Error) {
    // Try to parse revert reason from error message
    const match = error.message.match(/reverted with reason string '([^']+)'/)
    if (match) {
      return match[1]
    }
    // Check for common revert patterns
    const revertMatch = error.message.match(/execution reverted:?\s*(.+?)(?:\n|$)/i)
    if (revertMatch) {
      return revertMatch[1].trim()
    }
    return error.message
  }
  return String(error)
}

/**
 * Gas configuration for server transactions
 */
const GAS_CONFIG = {
  MAX_FEE_GWEI: 5, // Cap at 5 gwei to prevent excessive costs during spikes
  PRIORITY_BOOST: 1.5, // 50% boost for faster inclusion (reduced from 2x)
  GAS_LIMIT: 600_000n // Conservative limit (reduced from 2M)
} as const

export function createSystemCalls(network: SetupNetworkResult) {
  /**
   * Get gas parameters for server transactions
   * Applies fee caps and priority boost based on current network conditions
   *
   * @param feeData Current network fee estimates
   * @returns Gas parameters to use for transaction
   */
  async function getGasParams(
    feeData: Awaited<ReturnType<typeof network.publicClient.estimateFeesPerGas>>
  ) {
    // Boost priority fee for faster inclusion
    const PRIORITY_MULTIPLIER = BigInt(Math.floor(GAS_CONFIG.PRIORITY_BOOST * 100))
    const basePriorityFee = feeData.maxPriorityFeePerGas ?? 0n
    const boostedPriorityFee = (basePriorityFee * PRIORITY_MULTIPLIER) / 100n

    // Cap maxFeePerGas to prevent excessive costs during spikes
    const maxFeeCapWei = parseGwei(GAS_CONFIG.MAX_FEE_GWEI.toString())
    const baseMaxFee = feeData.maxFeePerGas ?? maxFeeCapWei
    const maxFeePerGas = baseMaxFee < maxFeeCapWei ? baseMaxFee : maxFeeCapWei

    // Ensure maxPriorityFeePerGas doesn't exceed maxFeePerGas (EIP-1559 constraint)
    const maxPriorityFeePerGas =
      boostedPriorityFee > maxFeePerGas ? maxFeePerGas : boostedPriorityFee

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: GAS_CONFIG.GAS_LIMIT
    }
  }
  /**
   * Apply the outcome changes to the blockchain state
   * @param rat - The rat to apply the outcome to
   * @param trip - The trip to apply the outcome to
   * @param outcome - The outcome to apply to the rat and trip
   * @param logger - Logger for accumulating trip logs
   * @param outcomeId - The outcome ID for error tracking
   * @returns The validated outcome and calculated changes
   */
  const applyOutcome = async (
    rat: Rat,
    trip: Trip,
    outcome: OutcomeReturnValue,
    logger: TripLogger,
    outcomeId?: string
  ) => {
    try {
      // Get trip count before sending transaction
      const initialTripCount = rat.tripCount

      const args = createOutcomeCallArgs(rat, trip, outcome, logger)

      // Log call arguments for debugging
      logger.log(`__ applyOutcome args:`)
      logger.log(`__   ratId: ${args[0]}`)
      logger.log(`__   tripId: ${args[1]}`)
      logger.log(`__   balanceTransfer: ${args[2]}`)
      logger.log(`__   itemsToRemove: ${JSON.stringify(args[3])}`)
      logger.log(`__   itemsToAdd: ${JSON.stringify(args[4])}`)
      logger.log(`__   rat.totalValue: ${rat.totalValue}`)
      logger.log(`__   trip.challengeTrip: ${trip.challengeTrip}`)
      logger.log(`__   trip.fixedMinValueToEnter: ${trip.fixedMinValueToEnter}`)
      logger.log(`__   trip.balance: ${trip.balance}`)

      // Get gas parameters with caps and priority boost
      const feeData = await network.publicClient.estimateFeesPerGas()
      const gasParams = await getGasParams(feeData)
      logger.log(
        `__ Gas params: maxFee=${gasParams.maxFeePerGas}, priorityFee=${gasParams.maxPriorityFeePerGas}, limit=${gasParams.gas}`
      )

      // Send transaction
      logger.log(`__ Sending transaction...`)
      const tx = await network.worldContract.write.ratfun__applyOutcome(args, gasParams)
      logger.log(`__ Transaction submitted: ${tx}`)

      const receipt = await network.waitForTransaction(tx)
      logger.log(
        `__ Transaction receipt - status: ${receipt.status}, blockNumber: ${receipt.blockNumber}`
      )

      if (receipt.status === "reverted") {
        throw new ContractCallError(
          `Transaction reverted on-chain. Hash: ${tx}, Block: ${receipt.blockNumber}`
        )
      }

      // Suggested outcomes were sent to the chain
      // We get the new onchain state and update the outcome with the actual changes
      try {
        // Wait for store sync to update after contract execution
        // Based on tripCount increment
        const newOnChainData = await getEnterTripData(rat.id, logger, trip.id, undefined, {
          waitForUpdate: true,
          initialTripCount
        })

        const validatedOutcome = updateOutcome(
          outcome,
          rat,
          newOnChainData.rat,
          logger,
          newOnChainData.trip as Trip,
          outcomeId
        )

        const { newTripValue, tripValueChange } = getTripValue(trip, newOnChainData.trip)

        const newRatBalance = newOnChainData.rat?.balance ?? 0

        const { newRatValue, ratValueChange } = getRatValue(rat, newOnChainData.rat, logger)

        // Validate the outcome to ensure system invariants hold
        validateOutcome(
          newOnChainData.rat,
          trip,
          newOnChainData.trip as Trip,
          ratValueChange,
          tripValueChange,
          logger,
          outcomeId
        )

        return {
          validatedOutcome,
          newTripValue,
          tripValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange
        }
      } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof SystemCallError) {
          throw error
        }

        // Otherwise, wrap it in our custom error
        throw new OutcomeUpdateError(
          `Error updating outcome: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
      }
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Extract and log revert reason for debugging
      const revertReason = extractRevertReason(error)
      logger.log(`__ applyOutcome ERROR: ${revertReason}`)

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(`Error applying outcome: ${revertReason}`, error)
    }
  }

  /**
   * Create a new trip
   * @param playerId - The ID of the player creating the trip
   * @param tripID - The ID of the trip to create
   * @param tripCreationCost - The cost of creating the trip
   * @param tripPrompt - The prompt for the trip
   * @param isChallengeTrip - Whether this is a challenge trip
   * @param fixedMinValueToEnter - Fixed minimum rat value to enter (challenge trips only)
   * @param overrideMaxValuePerWinPercentage - Override max value per win percentage (challenge trips only)
   * @returns True if the trip was created successfully
   */
  const createTrip = async (
    playerId: Hex,
    tripID: Hex,
    tripCreationCost: number,
    tripPrompt: string,
    isChallengeTrip?: boolean,
    fixedMinValueToEnter?: number,
    overrideMaxValuePerWinPercentage?: number
  ) => {
    try {
      // Log call arguments
      console.log(`__ createTrip args:`)
      console.log(`__   playerId: ${playerId}`)
      console.log(`__   tripID: ${tripID}`)
      console.log(`__   tripCreationCost: ${tripCreationCost}`)
      console.log(`__   isChallengeTrip: ${isChallengeTrip}`)
      console.log(`__   fixedMinValueToEnter: ${fixedMinValueToEnter}`)
      console.log(`__   overrideMaxValuePerWinPercentage: ${overrideMaxValuePerWinPercentage}`)
      console.log(`__   tripPrompt: ${tripPrompt.substring(0, 100)}...`)

      // Get gas parameters with caps and priority boost
      const feeData = await network.publicClient.estimateFeesPerGas()
      const gasParams = await getGasParams(feeData)
      console.log(
        `__ Gas params: maxFee=${gasParams.maxFeePerGas}, priorityFee=${gasParams.maxPriorityFeePerGas}, limit=${gasParams.gas}`
      )

      console.log(`__ Sending createTrip transaction...`)
      const tx = await network.worldContract.write.ratfun__createTrip(
        [
          playerId,
          tripID,
          BigInt(tripCreationCost),
          isChallengeTrip ?? false,
          BigInt(fixedMinValueToEnter ?? 0),
          BigInt(overrideMaxValuePerWinPercentage ?? 0),
          tripPrompt
        ],
        gasParams
      )
      console.log(`__ Transaction submitted: ${tx}`)

      const receipt = await network.waitForTransaction(tx)
      console.log(
        `__ Transaction receipt - status: ${receipt.status}, blockNumber: ${receipt.blockNumber}`
      )

      if (receipt.status === "reverted") {
        throw new ContractCallError(
          `createTrip reverted on-chain. Hash: ${tx}, Block: ${receipt.blockNumber}`
        )
      }

      return true
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Extract and log revert reason for debugging
      const revertReason = extractRevertReason(error)
      console.log(`__ createTrip ERROR: ${revertReason}`)

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(`Error creating trip: ${revertReason}`, error)
    }
  }

  return {
    applyOutcome,
    createTrip
  }
}
