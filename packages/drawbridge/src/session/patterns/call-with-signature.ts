import { Chain } from "viem"
import { writeContract as viem_writeContract } from "viem/actions"
import { getAction } from "viem/utils"
import { SignCallOptions, signCall } from "./eip712-signing"
import CallWithSignatureAbi from "@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json"
import CallWithSignatureAltAbi from "@dk1a/world-module-callwithsignature-alt/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json"
import { ConnectedClient } from "../../types"
import { logger } from "../../logger"

export type CallWithSignatureOptions<chain extends Chain = Chain> = SignCallOptions<chain> & {
  sessionClient: ConnectedClient
}

/**
 * Call a World system using signature-based execution (for EOAs)
 *
 * MUD's CallWithSignature pattern allows EOAs to execute gasless transactions:
 *
 * 1. User signs an EIP-712 message (free, off-chain)
 * 2. Session account submits the signature + call to World
 * 3. World's CallWithSignatureSystem validates the signature
 * 4. If valid, executes the call as the user (with user's identity)
 *
 * This enables gasless transactions - the session account pays gas via paymaster,
 * but the call executes with the user's permissions/identity.
 *
 * Flow:
 *   User (EOA) → signs message → Session Account → submits to World
 *   → World validates signature → executes as User
 *
 * @param options Call parameters including user client and session client
 * @returns Transaction hash
 */
export async function callWithSignature<chain extends Chain = Chain>({
  sessionClient,
  ...opts
}: CallWithSignatureOptions<chain>) {
  logger.log("[drawbridge] callWithSignature starting:", {
    userAddress: opts.userClient.account.address,
    sessionAddress: sessionClient.account.address,
    worldAddress: opts.worldAddress,
    systemId: opts.systemId,
    altDomain: opts.altDomain
  })

  logger.log("[drawbridge] callWithSignature: requesting user signature...")
  const signature = await signCall(opts)
  logger.log("[drawbridge] callWithSignature: user signature obtained")

  // Submit transaction to World
  // TypeScript workaround: viem's writeContract has complex type inference that
  // doesn't perfectly match the CallWithSignatureAbi args structure.
  // The runtime types are correct - we're calling:
  // callWithSignature(address signer, bytes32 systemId, bytes callData, bytes signature)
  // This cast is safe because we're manually constructing the correct args array.
  logger.log("[drawbridge] callWithSignature: submitting transaction via session account...")
  const hash = await getAction(
    sessionClient,
    viem_writeContract,
    "writeContract"
  )({
    address: opts.worldAddress,
    abi: opts.altDomain ? CallWithSignatureAltAbi : CallWithSignatureAbi,
    functionName: opts.altDomain ? "callWithSignatureAlt" : "callWithSignature",
    args: [opts.userClient.account.address, opts.systemId, opts.callData, signature]
  } as never)

  logger.log("[drawbridge] callWithSignature: transaction submitted:", { hash })
  return hash
}
