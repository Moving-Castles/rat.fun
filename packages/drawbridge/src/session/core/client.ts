import { Address, LocalAccount } from "viem"
import { smartAccountActions } from "permissionless"
import { callFrom, sendUserOperationFrom } from "@latticexyz/world/internal"
import type { PaymasterClient } from "viem/account-abstraction"
import { createBundlerClient } from "../../bundler/client"
import { SessionClient, PublicClient } from "../../types"
import { SmartAccount } from "viem/account-abstraction"
import { getBundlerTransport } from "../../bundler/transport"
import { logger } from "../../logger"

/**
 * Create session client with MUD World extensions
 *
 * Takes a standard ERC-4337 smart account and extends it with MUD-specific functionality:
 *
 * 1. **smartAccountActions** - Standard AA operations (sendUserOperation, etc.)
 * 2. **callFrom** - Routes writeContract calls through World.callFrom()
 *    - Automatically adds delegator context
 *    - World validates delegation before executing
 * 3. **sendUserOperationFrom** - Routes user operations through World
 * 4. **Context properties** - Adds userAddress, worldAddress, internal_signer
 *
 * The resulting SessionClient can call World systems on behalf of the user,
 * as long as delegation is registered.
 *
 * @param params Session client parameters
 * @returns SessionClient with MUD World extensions
 */
export async function getSessionClient({
  publicClient,
  userAddress,
  sessionAccount,
  sessionSigner,
  worldAddress,
  paymasterOverride,
  ethPriceUSD
}: {
  /** Public client for read operations (used by MUD callFrom/sendUserOperationFrom extensions) */
  publicClient: PublicClient
  userAddress: Address
  sessionAccount: SmartAccount
  sessionSigner: LocalAccount
  worldAddress: Address
  paymasterOverride?: PaymasterClient
  ethPriceUSD?: number
}): Promise<SessionClient> {
  const chain = publicClient.chain
  if (!chain) {
    throw new Error("Public client had no associated chain.")
  }

  if (paymasterOverride) {
    logger.log(`[Drawbridge/SessionClient] Creating session client with paymaster override`)
  }

  // Create bundler client for submitting user operations
  const bundlerClient = createBundlerClient({
    transport: getBundlerTransport(chain, ethPriceUSD),
    client: publicClient,
    account: sessionAccount,
    paymaster: paymasterOverride
  })

  // Extend with standard ERC-4337 smart account actions
  const sessionClient = bundlerClient
    .extend(smartAccountActions)
    // Extend with MUD World delegation routing
    // This intercepts writeContract calls and routes them through World.callFrom()
    .extend(
      callFrom({
        worldAddress,
        delegatorAddress: userAddress,
        publicClient
      })
    )
    // Extend with MUD World user operation routing
    .extend(
      sendUserOperationFrom({
        worldAddress,
        delegatorAddress: userAddress,
        publicClient
      })
    )
    // Add context properties for reference
    .extend(() => ({ userAddress, worldAddress, internal_signer: sessionSigner }))

  return sessionClient
}
