import { zeroAddress, Hex, Address } from "viem"
import {
  sendUserOperation,
  waitForUserOperationReceipt,
  SmartAccount,
  UserOperationReceipt
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { SessionClient } from "../../types"

/**
 * Smart account with optional factory properties (internal use only)
 * Some smart account implementations add these properties dynamically
 */
export type SmartAccountWithFactory = SmartAccount & {
  factory?: Address
  factoryData?: Hex
}

/**
 * Setup session status updates for progress tracking
 */
export type SetupSessionStatus =
  | { type: "checking_wallet"; message: string }
  | { type: "deploying_wallet"; message: string }
  | { type: "wallet_deployed"; message: string }
  | { type: "registering_delegation"; message: string }
  | { type: "deploying_session"; message: string }
  | { type: "complete"; message: string }
  | { type: "error"; message: string; error?: Error }

/**
 * Common parameters for session setup (both EOA and Smart Account)
 */
export type SetupSessionBaseParams = {
  /** Session smart account client with MUD extensions */
  sessionClient: SessionClient
  /** MUD World contract address */
  worldAddress: Hex
  /** Progress callback for status updates */
  onStatus?: (status: SetupSessionStatus) => void
}

/**
 * Deploy session account if not already deployed
 *
 * This function is shared by both EOA and Smart Account setup flows.
 * It deploys the session account (ERC-4337 smart account) by sending
 * an empty user operation.
 *
 * @param sessionClient Session smart account client
 * @param onStatus Optional status callback
 */
export async function deploySessionAccount(
  sessionClient: SessionClient,
  onStatus?: (status: SetupSessionStatus) => void
): Promise<void> {
  const sessionDeployed = await sessionClient.account.isDeployed?.()
  console.log("[entrykit-drawbridge] Session account deployed:", sessionDeployed)

  if (sessionDeployed) {
    console.log("[entrykit-drawbridge] Session account already deployed")
    return
  }

  onStatus?.({ type: "deploying_session", message: "Finalizing session setup..." })

  try {
    const hash = await getAction(
      sessionClient,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls: [{ to: zeroAddress }]
    })

    console.log("[entrykit-drawbridge] Session deploy tx:", hash)

    // Add timeout
    const receiptPromise = getAction(
      sessionClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Session deployment timeout after 30s")), 30000)
    )

    const receipt = (await Promise.race([receiptPromise, timeoutPromise])) as UserOperationReceipt

    if (!receipt.success) {
      throw new Error("Failed to deploy session account")
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[entrykit-drawbridge] Session deployment error:", errorMsg)

    // Check if timeout but actually deployed
    if (errorMsg.includes("timeout")) {
      const nowDeployed = await sessionClient.account.isDeployed?.()
      if (nowDeployed) {
        console.log("[entrykit-drawbridge] Session deployed despite timeout")
        onStatus?.({ type: "complete", message: "Session setup complete!" })
        return
      }
    }

    onStatus?.({ type: "error", message: "Session deployment failed", error: error as Error })
    throw error
  }
}
