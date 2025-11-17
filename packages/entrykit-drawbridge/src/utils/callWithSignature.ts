import { Chain, parseErc6492Signature } from "viem"
import { writeContract as viem_writeContract } from "viem/actions"
import { getAction } from "viem/utils"
import { SignCallOptions, signCall } from "./signCall"
import CallWithSignatureAbi from "@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json"
import { ConnectedClient } from "../core/types"
import { isWalletDeployed, deployWalletIfNeeded } from "./smartWalletDeployment"

export type CallWithSignatureOptions<chain extends Chain = Chain> = SignCallOptions<chain> & {
  sessionClient: ConnectedClient
}

/**
 * Call a World system using signature-based execution (for EOAs and smart wallets)
 *
 * MUD's CallWithSignature pattern allows EOAs and smart wallets to execute gasless transactions:
 *
 * 1. User signs an EIP-712 message (free, off-chain)
 * 2. Session account submits the signature + call to World
 * 3. World's CallWithSignatureSystem validates the signature
 * 4. If valid, executes the call as the user (with user's identity)
 *
 * This enables gasless transactions - the session account pays gas via paymaster,
 * but the call executes with the user's permissions/identity.
 *
 * For undeployed smart wallets (e.g., new Coinbase Smart Wallet), this function
 * automatically detects ERC-6492 wrapped signatures and deploys the wallet using
 * the session account before submitting the call.
 *
 * Flow:
 *   User → signs message → Session Account → (deploys wallet if needed) → submits to World
 *   → World validates signature → executes as User
 *
 * @param options Call parameters including user client and session client
 * @returns Transaction hash
 */
export async function callWithSignature<chain extends Chain = Chain>({
  sessionClient,
  ...opts
}: CallWithSignatureOptions<chain>) {
  const rawSignature = await signCall(opts)

  // Check for ERC-6492 wrapped signatures
  const {
    address: factoryAddress,
    data: factoryCalldata,
    signature
  } = parseErc6492Signature(rawSignature)

  let finalSignature = signature ?? rawSignature

  if (factoryAddress != null) {
    // ERC-6492 signature detected - deploy wallet if needed
    console.log("[callWithSignature] ERC-6492 signature detected")

    await deployWalletIfNeeded(
      sessionClient,
      opts.userClient.account.address,
      factoryAddress,
      factoryCalldata
    )

    finalSignature = signature
  }

  // Submit transaction to World
  try {
    return await getAction(
      sessionClient,
      viem_writeContract,
      "writeContract"
    )({
      address: opts.worldAddress,
      abi: CallWithSignatureAbi,
      functionName: "callWithSignature",
      args: [opts.userClient.account.address, opts.systemId, opts.callData, finalSignature]
    } as never)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed")) {
      throw new Error("Smart wallet was just deployed. Please try again.")
    }

    throw error
  }
}
