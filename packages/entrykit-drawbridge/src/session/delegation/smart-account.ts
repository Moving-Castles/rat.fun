import { sendUserOperation, waitForUserOperationReceipt } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { unlimitedDelegationControlId, worldAbi, ConnectedClient } from "../../types"
import { deployWalletIfNeeded, isWalletDeployed } from "../patterns/wallet-deployment"
import { SetupSessionBaseParams, SmartAccountWithFactory, deploySessionAccount } from "./shared"

export type SetupSessionSmartAccountParams = SetupSessionBaseParams & {
  /** User's connected smart wallet client */
  userClient: ConnectedClient
  /** Whether to register delegation (default: true) */
  registerDelegation?: boolean
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
  registerDelegation = true,
  onStatus
}: SetupSessionSmartAccountParams): Promise<void> {
  const sessionAddress = sessionClient.account.address
  const userAddress = userClient.account.address

  console.log("[entrykit-drawbridge] Smart Account setup:", { userAddress })

  onStatus?.({ type: "checking_wallet", message: "Checking wallet status..." })

  // CHECK AND DEPLOY USER'S WALLET IF NEEDED
  const account = userClient.account as SmartAccountWithFactory
  const factoryArgs = await account.getFactoryArgs()
  const hasFactoryData = factoryArgs.factory && factoryArgs.factoryData

  console.log("[entrykit-drawbridge] Smart wallet check:", { hasFactoryData, userAddress })

  const alreadyDeployed = await isWalletDeployed(sessionClient, userAddress)

  if (alreadyDeployed && hasFactoryData) {
    // Wallet deployed but has factory data - remove it
    console.log("[entrykit-drawbridge] Removing factory data from deployed wallet")
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" })

    delete account.factory
    delete account.factoryData
    account.factory = undefined
    account.factoryData = undefined

    console.log("[entrykit-drawbridge] Factory removed:", { stillHasFactory: !!account.factory })
  } else if (!alreadyDeployed && hasFactoryData) {
    // Wallet not deployed - deploy it
    console.log("[entrykit-drawbridge] Deploying user wallet...")
    onStatus?.({ type: "deploying_wallet", message: "Deploying wallet (one-time setup)..." })

    await deployWalletIfNeeded(
      sessionClient,
      userAddress,
      factoryArgs.factory!,
      factoryArgs.factoryData!
    )

    onStatus?.({ type: "wallet_deployed", message: "Wallet deployed successfully!" })

    // Remove factory/factoryData after deployment
    delete account.factory
    delete account.factoryData
    account.factory = undefined
    account.factoryData = undefined

    console.log("[entrykit-drawbridge] Wallet deployed, factory removed")
  } else {
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" })
  }

  // Proceed with delegation registration
  const calls = []

  if (registerDelegation) {
    calls.push({
      to: worldAddress,
      abi: worldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    })
  }

  if (!calls.length) {
    // No delegation to register, just deploy session account
    await deploySessionAccount(sessionClient, onStatus)
    onStatus?.({ type: "complete", message: "Session setup complete!" })
    return
  }

  onStatus?.({ type: "registering_delegation", message: "Setting up session..." })

  // Final check: if factory/factoryData still present, try aggressive removal
  const accountBeforeSend = userClient.account as SmartAccountWithFactory
  console.log("[entrykit-drawbridge] Before sendUserOperation:", {
    hasFactory: !!accountBeforeSend.factory,
    hasFactoryData: !!accountBeforeSend.factoryData
  })

  if (accountBeforeSend.factory || accountBeforeSend.factoryData) {
    console.warn("[entrykit-drawbridge] Factory still present, attempting aggressive removal...")

    try {
      Object.defineProperty(accountBeforeSend, "factory", {
        value: undefined,
        writable: true,
        configurable: true
      })
      Object.defineProperty(accountBeforeSend, "factoryData", {
        value: undefined,
        writable: true,
        configurable: true
      })
    } catch (err) {
      console.error("[entrykit-drawbridge] Could not remove factory (readonly property)")
    }
  }

  try {
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls })
    console.log("[entrykit-drawbridge] User operation sent:", hash)

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
    console.error("[entrykit-drawbridge] User operation error:", errorMessage)

    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed")) {
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

  console.log("[entrykit-drawbridge] Smart Account setup complete")
  onStatus?.({ type: "complete", message: "Session setup complete!" })
}
