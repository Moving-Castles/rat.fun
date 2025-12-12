import { Address, Chain, Client, Hex, OneOf, Transport, toHex } from "viem"
import { signTypedData } from "viem/actions"
import { callWithSignatureTypes } from "@latticexyz/world-module-callwithsignature/internal"
import { getRecord } from "@latticexyz/store/internal"
import moduleConfig from "@latticexyz/world-module-callwithsignature/mud.config"
import moduleConfigAlt from "@dk1a/world-module-callwithsignature-alt/mud.config"
import { hexToResource } from "@latticexyz/common"
import { getAction } from "viem/utils"
import { ConnectedClient } from "../../types"
import { logger } from "../../logger"

export type SignCallOptions<chain extends Chain = Chain> = {
  userClient: ConnectedClient<chain>
  worldAddress: Address
  systemId: Hex
  callData: Hex
  altDomain: boolean
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
 *    - Domain: depends on altDomain
 *    - - if false: verifyingCotract(World contract), salt(chain ID)
 *    - - if true: name(CallWithSignatureAlt), version(1), chainId, verifyingContract(World contract
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
  client,
  altDomain
}: SignCallOptions<chain>) {
  logger.log("[drawbridge] signCall starting:", {
    userAddress: userClient.account.address,
    worldAddress,
    systemId,
    callDataLength: callData.length,
    chainId: userClient.chain.id,
    accountType: userClient.account.type,
    transportType: userClient.transport?.type,
    transportName: userClient.transport?.name
  })

  // Get nonce for replay protection
  // Either use provided nonce or fetch from World contract
  const nonce =
    initialNonce ??
    (client
      ? (
          await getRecord(client, {
            address: worldAddress,
            table: altDomain
              ? moduleConfigAlt.tables.AltCallWithSignatureNonces
              : moduleConfig.tables.CallWithSignatureNonces,
            key: { signer: userClient.account.address },
            blockTag: "pending"
          })
        ).nonce
      : 0n)

  logger.log("[drawbridge] signCall nonce fetched:", { nonce: nonce.toString() })

  // Parse MUD system ID into namespace and name components
  const { namespace: systemNamespace, name: systemName } = hexToResource(systemId)

  logger.log("[drawbridge] signCall system parsed:", { systemNamespace, systemName })

  // Build domain and message for logging
  // Note: chainId as number - some wallets (Farcaster) can't parse bigint/hex format
  const domain = altDomain
    ? {
        name: "CallWithSignatureAlt",
        version: "1",
        chainId: userClient.chain.id,
        verifyingContract: worldAddress
      }
    : {
        verifyingContract: worldAddress,
        salt: toHex(userClient.chain.id, { size: 32 })
      }

  logger.log("[drawbridge] domain constructed:", {
    altDomain,
    chainIdType: altDomain ? "number" : "N/A",
    chainIdValue: altDomain ? userClient.chain.id : "N/A (using salt)"
  })

  const message = {
    signer: userClient.account.address,
    systemNamespace,
    systemName,
    callData,
    nonce
  }

  logger.log("[drawbridge] signTypedData params:", {
    account: userClient.account.address,
    domain,
    types: callWithSignatureTypes,
    primaryType: "Call",
    message: {
      ...message,
      callData: `${callData.slice(0, 66)}... (${callData.length} chars)`,
      nonce: nonce.toString()
    }
  })

  // Log the raw EIP-712 structure that will be sent to the wallet
  // This helps debug wallet compatibility issues
  logger.log(
    "[drawbridge] EIP-712 raw structure:",
    JSON.stringify(
      {
        types: {
          EIP712Domain: altDomain
            ? [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" }
              ]
            : [
                { name: "verifyingContract", type: "address" },
                { name: "salt", type: "bytes32" }
              ],
          ...callWithSignatureTypes
        },
        primaryType: "Call",
        domain,
        message: {
          signer: userClient.account.address,
          systemNamespace,
          systemName,
          callData,
          nonce: nonce.toString()
        }
      },
      null,
      2
    )
  )

  // Sign EIP-712 typed data
  // User signs this message, session account will submit it

  // Log exact types being passed to viem
  logger.log("[drawbridge] signTypedData exact values:", {
    nonceType: typeof nonce,
    nonceValue: nonce,
    systemNamespaceLength: systemNamespace.length,
    systemNamespaceIsEmpty: systemNamespace === "",
    callDataType: typeof callData,
    callDataIsHex: callData.startsWith("0x")
  })

  // Log the exact eth_signTypedData_v4 params that viem will send
  // This matches the JSON-RPC format: eth_signTypedData_v4(address, typedData)
  const typedDataForRpc = {
    types: {
      EIP712Domain: altDomain
        ? [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" }
          ]
        : [
            { name: "verifyingContract", type: "address" },
            { name: "salt", type: "bytes32" }
          ],
      ...callWithSignatureTypes
    },
    primaryType: "Call" as const,
    domain,
    message: {
      ...message,
      // Convert bigint to hex string for JSON-RPC (how viem serializes uint256)
      nonce: `0x${nonce.toString(16)}`
    }
  }
  logger.log("[drawbridge] eth_signTypedData_v4 params (JSON-RPC format):", {
    method: "eth_signTypedData_v4",
    params: [userClient.account.address, JSON.stringify(typedDataForRpc)]
  })

  try {
    const signature = await getAction(
      userClient,
      signTypedData,
      "signTypedData"
    )({
      account: userClient.account,
      // EIP-712 domain bound to World contract and chain
      domain,
      // MUD's CallWithSignature type definitions
      types: callWithSignatureTypes,
      primaryType: "Call",
      // Message contains all call details + nonce
      message
    })

    logger.log("[drawbridge] signTypedData success:", { signatureLength: signature.length })
    return signature
  } catch (error) {
    logger.error("[drawbridge] signTypedData failed:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorDetails: (error as { details?: string })?.details
    })
    throw error
  }
}
