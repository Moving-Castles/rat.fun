import { Hex } from "viem"
import { SessionClient, ConnectedClient, PublicClient } from "../../types"
import { SetupSessionStatus } from "./shared"
import { setupSessionSmartAccount } from "./smart-account"
import { setupSessionEOA } from "./eoa"
import { checkDelegation } from "./check"

/**
 * Complete setup session parameters (supports both EOA and Smart Account)
 */
export type SetupSessionParams = {
  /** Public client for reading blockchain state */
  publicClient: PublicClient
  /** User's connected wallet client (EOA or Smart Account) */
  userClient: ConnectedClient
  /** Session smart account client with MUD extensions */
  sessionClient: SessionClient
  /** MUD World contract address */
  worldAddress: Hex
  /** Progress callback for status updates */
  onStatus?: (status: SetupSessionStatus) => void
}

// Re-export SetupSessionStatus for convenience
export type { SetupSessionStatus }

/**
 * Setup session by registering delegation and deploying session account
 *
 * This is the main entry point that automatically routes to the correct implementation
 * based on the user's wallet type.
 *
 * Returns early if session is already fully set up.
 *
 * Flow differs based on wallet type:
 *
 * **Smart Account Wallet:**
 * - Checks and deploys user's wallet if needed
 * - Sends user operation to register delegation
 * - User's smart account submits the operation
 * - Uses bundler + paymaster infrastructure
 *
 * **EOA (Externally Owned Account):**
 * - Uses CallWithSignature pattern (gasless for user)
 * - User signs a message (EIP-712)
 * - Session account submits the signature + call
 * - World validates signature and executes as user
 *
 * @param params Setup parameters
 */
export async function setupSession({
  publicClient,
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}: SetupSessionParams): Promise<void> {
  const userAddress = userClient.account.address
  const sessionAddress = sessionClient.account.address

  console.log("[drawbridge] Setup session:", {
    userAddress,
    accountType: userClient.account.type
  })

  // Check if session is already fully set up
  const hasDelegation = await checkDelegation({
    client: publicClient,
    worldAddress,
    userAddress,
    sessionAddress
  })

  const sessionDeployed = await sessionClient.account.isDeployed?.()

  if (hasDelegation && sessionDeployed) {
    console.log("[drawbridge] Session already fully set up, skipping")
    onStatus?.({ type: "complete", message: "Session already set up!" })
    return
  }

  console.log("[drawbridge] Session setup required:", { hasDelegation, sessionDeployed })

  // Route to appropriate implementation based on wallet type
  if (userClient.account.type === "smart") {
    return setupSessionSmartAccount({
      userClient,
      sessionClient,
      worldAddress,
      onStatus
    })
  } else {
    return setupSessionEOA({
      publicClient,
      userClient,
      sessionClient,
      worldAddress,
      onStatus
    })
  }
}
