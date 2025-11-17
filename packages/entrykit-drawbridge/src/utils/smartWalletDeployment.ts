import { getCode, sendTransaction, waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"

/**
 * Shared utilities for smart wallet deployment
 *
 * Handles counterfactual smart wallets (e.g., Coinbase Smart Wallet) that use
 * CREATE2 and exist at a deterministic address before deployment.
 */

/**
 * Check if a smart wallet is deployed on-chain
 *
 * @param client Client to use for checking
 * @param address Wallet address to check
 * @returns True if deployed, false otherwise
 */
export async function isWalletDeployed(client: any, address: `0x${string}`): Promise<boolean> {
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
 * @param userAddress User's wallet address to deploy
 * @param factoryAddress Factory contract address that can deploy the wallet
 * @param factoryCalldata Deployment calldata for the factory
 */
export async function deployWallet(
  client: any,
  userAddress: `0x${string}`,
  factoryAddress: `0x${string}`,
  factoryCalldata: `0x${string}`
): Promise<void> {
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
    } as any)

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
    await new Promise(resolve => setTimeout(resolve, 2000))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // If already deployed, that's fine
    if (
      errorMessage.includes("AA10") ||
      errorMessage.includes("already constructed") ||
      errorMessage.includes("already deployed")
    ) {
      return
    }

    throw new Error(`Failed to deploy smart wallet: ${errorMessage}`)
  }
}

/**
 * Deploy a smart wallet if it's not already deployed
 *
 * @param client Client to use for deployment
 * @param userAddress User's wallet address
 * @param factoryAddress Factory contract address
 * @param factoryCalldata Deployment calldata
 * @returns True if deployment was needed and completed, false if already deployed
 */
export async function deployWalletIfNeeded(
  client: any,
  userAddress: `0x${string}`,
  factoryAddress: `0x${string}`,
  factoryCalldata: `0x${string}`
): Promise<boolean> {
  const deployed = await isWalletDeployed(client, userAddress)

  if (deployed) {
    return false
  }

  await deployWallet(client, userAddress, factoryAddress, factoryCalldata)

  // Verify deployment succeeded
  const nowDeployed = await isWalletDeployed(client, userAddress)
  if (!nowDeployed) {
    throw new Error(
      `Wallet deployment appeared to succeed but contract code not found at ${userAddress}`
    )
  }

  return true
}
