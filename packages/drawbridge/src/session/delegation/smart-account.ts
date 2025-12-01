import { sendUserOperation, waitForUserOperationReceipt } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { unlimitedDelegationControlId, worldAbi, ConnectedClient } from "../../types"
import {
  deployWallet,
  isWalletDeployed,
  isAlreadyDeployedError
} from "../patterns/wallet-deployment"
import {
  SetupSessionBaseParams,
  SmartAccountWithFactory,
  deploySessionAccount,
  clearFactoryData
} from "./shared"
import { logger } from "../../logger"

export type SetupSessionSmartAccountParams = SetupSessionBaseParams & {
  /** User's connected smart wallet client */
  userClient: ConnectedClient
}

/**
 * Setup session for Smart Account wallets
 *
 * Smart Account Flow:
 * 1. Check if user's smart wallet is deployed on-chain
 * 2. Deploy wallet via factory if needed (counterfactual → deployed)
 * 3. Remove factory data from account to prevent deployment conflicts
 * 4. Submit user operation to register delegation in World contract
 * 5. Deploy session account if needed
 *
 * Smart accounts can use ERC-4337 user operations with paymaster sponsorship.
 * However, they may be counterfactual (not yet deployed), requiring deployment first.
 *
 * @param params Setup parameters for smart account
 */
export async function setupSessionSmartAccount({
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}: SetupSessionSmartAccountParams): Promise<void> {
  const sessionAddress = sessionClient.account.address
  const userAddress = userClient.account.address

  logger.log("[drawbridge] Smart Account setup:", { userAddress })

  onStatus?.({ type: "checking_wallet", message: "Checking wallet status..." })

  // Check and deploy user's wallet if needed
  const account = userClient.account as SmartAccountWithFactory
  const factoryArgs = await account.getFactoryArgs()
  const hasFactoryData = factoryArgs.factory && factoryArgs.factoryData

  logger.log("[drawbridge] Smart wallet check:", { hasFactoryData, userAddress })

  const alreadyDeployed = await isWalletDeployed(sessionClient, userAddress)

  logger.log("[drawbridge] Wallet deployed:", alreadyDeployed)

  if (alreadyDeployed && hasFactoryData) {
    logger.log("[drawbridge] CASE 1: Wallet deployed and has factory data")
    // Wallet deployed but has factory data - remove it
    logger.log("[drawbridge] Removing factory data from deployed wallet")
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" })
    clearFactoryData(account)
  } else if (!alreadyDeployed && hasFactoryData) {
    logger.log("[drawbridge] CASE 2: Wallet not deployed and has factory data")
    // Wallet not deployed - deploy it
    logger.log("[drawbridge] Deploying user wallet...")
    onStatus?.({ type: "deploying_wallet", message: "Deploying wallet (one-time setup)..." })

    await deployWallet(sessionClient, factoryArgs.factory!, factoryArgs.factoryData!)

    // Verify deployment succeeded
    const nowDeployed = await isWalletDeployed(sessionClient, userAddress)
    if (!nowDeployed) {
      throw new Error(
        `Wallet deployment appeared to succeed but contract code not found at ${userAddress}`
      )
    }

    onStatus?.({ type: "wallet_deployed", message: "Wallet deployed successfully!" })

    // Remove factory/factoryData after deployment
    clearFactoryData(account)
  } else {
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" })
  }

  // Proceed with delegation registration
  onStatus?.({ type: "registering_delegation", message: "Setting up session..." })

  const calls = [
    {
      to: worldAddress,
      abi: worldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    }
  ]

  // Final check: if factory/factoryData still present, try removal again
  const accountBeforeSend = userClient.account as SmartAccountWithFactory
  if (accountBeforeSend.factory || accountBeforeSend.factoryData) {
    logger.warn("[drawbridge] Factory still present, attempting removal again...")
    clearFactoryData(accountBeforeSend)
  }

  try {
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls })
    logger.log("[drawbridge] User operation sent:", hash)

    const receipt = await getAction(
      userClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash })

    if (!receipt.success) {
      throw new Error("User operation failed during session setup")
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error("[drawbridge] User operation error:", errorMessage)

    if (isAlreadyDeployedError(errorMessage)) {
      const helpfulError = new Error(
        "Smart wallet deployment conflict. Please try again - it should work on the second attempt."
      )
      onStatus?.({ type: "error", message: "Please try again", error: helpfulError })
      throw helpfulError
    }

    onStatus?.({ type: "error", message: "Session setup failed", error: error as Error })
    throw error
  }

  // Deploy session account if needed
  await deploySessionAccount(sessionClient, onStatus)

  logger.log("[drawbridge] Smart Account setup complete")
  onStatus?.({ type: "complete", message: "Session setup complete!" })
}
