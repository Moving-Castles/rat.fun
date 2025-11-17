import { Account, Address, Chain, Client, LocalAccount, RpcSchema, Transport } from "viem"
import { smartAccountActions } from "permissionless"
import { callFrom, sendUserOperationFrom } from "@latticexyz/world/internal"
import type { PaymasterClient } from "viem/account-abstraction"
import { createBundlerClient } from "../bundler/createBundlerClient"
import { SessionClient } from "../core/types"
import { SmartAccount } from "viem/account-abstraction"
import { getBundlerTransport } from "../bundler/getBundlerTransport"

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
  userAddress,
  sessionAccount,
  sessionSigner,
  worldAddress,
  paymasterOverride
}: {
  userAddress: Address
  sessionAccount: SmartAccount
  sessionSigner: LocalAccount
  worldAddress: Address
  paymasterOverride?: PaymasterClient
}): Promise<SessionClient> {
  const client = sessionAccount.client
  if (!clientHasChain(client)) {
    throw new Error("Session account client had no associated chain.")
  }

  // Create bundler client for submitting user operations
  const bundlerClient = createBundlerClient({
    transport: getBundlerTransport(client.chain),
    client,
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
        publicClient: client
      })
    )
    // Extend with MUD World user operation routing
    .extend(
      sendUserOperationFrom({
        worldAddress,
        delegatorAddress: userAddress,
        publicClient: client
      })
    )
    // Add context properties for reference
    .extend(() => ({ userAddress, worldAddress, internal_signer: sessionSigner }))

  return sessionClient
}

/**
 * Type guard to ensure client has a chain
 */
function clientHasChain<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
>(
  client: Client<transport, chain, account, rpcSchema>
): client is Client<transport, Exclude<chain, undefined>, account, rpcSchema> {
  return client.chain != null
}
