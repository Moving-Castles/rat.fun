import { Hex, Client } from "viem"
import { SessionClient, ConnectedClient } from "../../types"
import { SetupSessionStatus } from "./shared"
import { setupSessionSmartAccount } from "./smart-account"
import { setupSessionEOA } from "./eoa"

/**
 * Complete setup session parameters (supports both EOA and Smart Account)
 */
export type SetupSessionParams = {
  /** Public client for reading blockchain state */
  client: Client
  /** User's connected wallet client (EOA or Smart Account) */
  userClient: ConnectedClient
  /** Session smart account client with MUD extensions */
  sessionClient: SessionClient
  /** MUD World contract address */
  worldAddress: Hex
  /** Whether to register delegation (default: true) */
  registerDelegation?: boolean
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
 * **Finally:**
 * - Deploys session account if not yet deployed (via empty user operation)
 *
 * @param params Setup parameters
 */
export async function setupSession({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true,
  onStatus
}: SetupSessionParams): Promise<void> {
  console.log("[entrykit-drawbridge] Setup session:", {
    userAddress: userClient.account.address,
    accountType: userClient.account.type
  })

  // Route to appropriate implementation based on wallet type
  if (userClient.account.type === "smart") {
    return setupSessionSmartAccount({
      userClient,
      sessionClient,
      worldAddress,
      registerDelegation,
      onStatus
    })
  } else {
    return setupSessionEOA({
      client,
      userClient,
      sessionClient,
      worldAddress,
      registerDelegation,
      onStatus
    })
  }
}
