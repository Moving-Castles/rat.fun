import { Address, Client } from "viem"
import { getCode, sendTransaction, waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import { DEPLOYMENT_TIMEOUTS } from "../../types"
import { logger } from "../../logger"

/**
 * Smart wallet deployment utilities
 *
 * Handles counterfactual smart wallets (e.g., Coinbase Smart Wallet) that use
 * CREATE2 and exist at a deterministic address before deployment.
 */

/**
 * Check if an error indicates a wallet is already deployed
 *
 * ERC-4337 bundlers and smart wallets return specific error codes when
 * attempting to deploy an already-deployed wallet:
 * - AA10: Account already deployed (ERC-4337 bundler error code)
 * - "already constructed": Some wallet implementations
 * - "already deployed": Generic message from some bundlers
 * - "is an existing contract, but initCode is nonempty": Bundler precheck error for deployed accounts with factory data
 *
 * @param errorMessage Error message to check
 * @returns True if error indicates wallet is already deployed
 */
export function isAlreadyDeployedError(errorMessage: string): boolean {
  return (
    errorMessage.includes("AA10") ||
    errorMessage.includes("already constructed") ||
    errorMessage.includes("already deployed") ||
    errorMessage.includes("is an existing contract, but initCode is nonempty")
  )
}

/**
 * Check if a smart wallet is deployed on-chain
 *
 * @param client Client to use for checking
 * @param address Wallet address to check
 * @returns True if deployed, false otherwise
 */
export async function isWalletDeployed(client: Client, address: Address): Promise<boolean> {
  const code = await getAction(
    client,
    getCode,
    "getCode"
  )({
    address
  })

  return code !== undefined && code !== "0x"
}

/**
 * Deploy a smart wallet using a factory contract
 *
 * This handles the deployment of counterfactual smart wallets. The wallet address
 * already exists (can receive funds) but needs on-chain deployment before it can
 * validate signatures or execute transactions.
 *
 * @param client Client to use for deployment transaction (usually session client with paymaster)
 * @param factoryAddress Factory contract address that can deploy the wallet
 * @param factoryCalldata Deployment calldata for the factory
 */
export async function deployWallet(
  client: Client,
  factoryAddress: Address,
  factoryCalldata: Address
): Promise<void> {
  if (!client.account) {
    throw new Error("Client must have an account to deploy wallet")
  }

  try {
    const txHash = await getAction(
      client,
      sendTransaction,
      "sendTransaction"
    )({
      account: client.account,
      chain: client.chain,
      to: factoryAddress,
      data: factoryCalldata
    })

    // Wait for deployment confirmation
    await getAction(
      client,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({
      hash: txHash
    })

    // Add delay for bundler/paymaster state to update
    // After deployment, bundlers cache account state and need time to refresh
    await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_TIMEOUTS.BUNDLER_STATE_SYNC))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // If already deployed, that's fine - not an error
    if (isAlreadyDeployedError(errorMessage)) {
      logger.log("[drawbridge] Wallet already deployed, continuing")
      return
    }

    throw new Error(`Failed to deploy smart wallet: ${errorMessage}`)
  }
}
