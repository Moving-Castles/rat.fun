import { Address, Chain, Client, Hex, OneOf, Transport, toHex } from "viem"
import { signTypedData } from "viem/actions"
import { callWithSignatureTypes } from "@latticexyz/world-module-callwithsignature/internal"
import { getRecord } from "@latticexyz/store/internal"
import moduleConfig from "@latticexyz/world-module-callwithsignature/mud.config"
import { hexToResource } from "@latticexyz/common"
import { getAction } from "viem/utils"
import { ConnectedClient } from "../core/types"

export type SignCallOptions<chain extends Chain = Chain> = {
  userClient: ConnectedClient<chain>
  worldAddress: Address
  systemId: Hex
  callData: Hex
} & OneOf<{ nonce: bigint } | { client: Client<Transport, chain> }>

/**
 * Sign a World system call using EIP-712 (for CallWithSignature pattern)
 *
 * This creates a signature that can be submitted by the session account to execute
 * a call on behalf of the user (EOA).
 *
 * Flow:
 * 1. **Fetch or use nonce** - Each user has a nonce in CallWithSignatureNonces table
 *    Prevents replay attacks
 *
 * 2. **Parse systemId** - MUD system IDs are resource IDs with namespace + name
 *    e.g., "world:PlayerSystem" → { namespace: "world", name: "PlayerSystem" }
 *
 * 3. **Sign EIP-712 message** - User signs typed data with:
 *    - Domain: World contract + chain ID
 *    - Message: signer, system, callData, nonce
 *
 * The resulting signature can be submitted to World.callWithSignature()
 * by the session account, which will validate and execute as the user.
 *
 * **Why this pattern?**
 * - EOAs can't pay gas via paymaster directly (not smart accounts)
 * - User signs message (free, no gas)
 * - Session account submits + pays gas via paymaster
 * - User gets gasless experience!
 *
 * @param options Sign options including user client and call details
 * @returns EIP-712 signature
 */
export async function signCall<chain extends Chain = Chain>({
  userClient,
  worldAddress,
  systemId,
  callData,
  nonce: initialNonce,
  client
}: SignCallOptions<chain>) {
  // Get nonce for replay protection
  // Either use provided nonce or fetch from World contract
  const nonce =
    initialNonce ??
    (client
      ? (
          await getRecord(client, {
            address: worldAddress,
            table: moduleConfig.tables.CallWithSignatureNonces,
            key: { signer: userClient.account.address },
            blockTag: "pending"
          })
        ).nonce
      : 0n)

  // Parse MUD system ID into namespace and name components
  const { namespace: systemNamespace, name: systemName } = hexToResource(systemId)

  // Sign EIP-712 typed data
  // User signs this message, session account will submit it
  return await getAction(
    userClient,
    signTypedData,
    "signTypedData"
  )({
    account: userClient.account,
    // EIP-712 domain bound to World contract and chain
    domain: {
      verifyingContract: worldAddress,
      salt: toHex(userClient.chain.id, { size: 32 })
    },
    // MUD's CallWithSignature type definitions
    types: callWithSignatureTypes,
    primaryType: "Call",
    // Message contains all call details + nonce
    message: {
      signer: userClient.account.address,
      systemNamespace,
      systemName,
      callData,
      nonce
    }
  })
}
