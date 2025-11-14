import { Chain, parseErc6492Signature } from "viem"
import { writeContract as viem_writeContract, getCode, sendTransaction, waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import { SignCallOptions, signCall } from "./signCall"
import CallWithSignatureAbi from "@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json"
import { ConnectedClient } from "../core/types"

export type CallWithSignatureOptions<chain extends Chain = Chain> = SignCallOptions<chain> & {
  sessionClient: ConnectedClient
}

/**
 * Check if a smart wallet is deployed
 *
 * This function checks if a smart wallet contract exists at the given address.
 *
 * @param sessionClient Session account client
 * @param walletAddress Address to check
 * @returns True if wallet is deployed, false otherwise
 */
async function isSmartWalletDeployed<chain extends Chain = Chain>(
  sessionClient: ConnectedClient<chain>,
  walletAddress: `0x${string}`
) {
  const code = await getAction(
    sessionClient,
    getCode,
    "getCode"
  )({
    address: walletAddress
  })

  // getCode returns undefined or '0x' if no contract exists at address
  if (code !== undefined && code !== "0x") {
    return true
  }

  return false
}

/**
 * Deploy a smart wallet
 *
 * This function checks if a smart wallet contract exists at the given address.
 * If not deployed, it uses the session account to deploy it via the factory contract.
 *
 * Context: Smart wallets like Coinbase Smart Wallet use CREATE2 to generate
 * counterfactual addresses. The wallet address exists and can receive funds
 * before deployment, but cannot validate signatures (ERC-1271) until the
 * contract bytecode is deployed on-chain.
 *
 * When a wallet signs before deployment, it returns an ERC-6492 wrapped signature
 * containing:
 * - Factory address: The contract that can deploy the wallet
 * - Factory calldata: Parameters to deploy the wallet at the expected address
 * - Inner signature: The actual ERC-1271 signature to validate after deployment
 *
 * This function handles the deployment step, allowing the inner signature to
 * be validated subsequently via standard ERC-1271.
 *
 * @param sessionClient Session account client (will pay gas for deployment)
 * @param walletAddress Address to check/deploy
 * @param factoryAddress Factory contract address that can deploy the wallet
 * @param factoryCalldata Calldata to send to factory to deploy the wallet
 * @throws Error if deployment fails
 */
async function deploySmartWallet<chain extends Chain = Chain>(
  sessionClient: ConnectedClient<chain>,
  walletAddress: `0x${string}`,
  factoryAddress: `0x${string}`,
  factoryCalldata: `0x${string}`
): Promise<void> {
  // Deploy smart wallet using session account
  // The paymaster will cover gas costs for this deployment
  try {
    const txHash = await getAction(
      sessionClient,
      sendTransaction,
      "sendTransaction"
    )({
      account: sessionClient.account,
      chain: sessionClient.chain,
      to: factoryAddress,
      data: factoryCalldata
    } as any)

    // Wait for deployment transaction to be confirmed before proceeding
    // This ensures the wallet contract code is on-chain before the next operation
    // Without this wait, subsequent operations may fail with AA10 errors
    // (bundler thinks wallet needs deployment when it's already being deployed)
    await getAction(
      sessionClient,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({
      hash: txHash
    })
  } catch (error) {
    // Check if error is about account already being deployed
    // This can happen if there was a race condition or previous deployment succeeded
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed") ||
        errorMessage.includes("already deployed")) {
      // Account is already deployed, this is fine - just return
      return
    }

    // Other error - wrap and rethrow
    throw new Error(
      `Failed to deploy smart wallet at ${walletAddress}: ${errorMessage}`
    )
  }
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
  // Get user's signature on the call
  const rawSignature = await signCall(opts)

  // Check for ERC-6492 wrapped signatures (e.g., from Coinbase Smart Wallet)
  // parseErc6492Signature returns:
  // - address: Factory contract address (null if not ERC-6492)
  // - data: Factory calldata to deploy the wallet
  // - signature: The unwrapped inner signature
  const {
    address: factoryAddress,
    data: factoryCalldata,
    signature
  } = parseErc6492Signature(rawSignature)

  let finalSignature = signature ?? rawSignature

  if (factoryAddress != null) {
    // ERC-6492 signature detected
    // Note: Coinbase Wallet may continue sending ERC-6492 signatures even after
    // deployment until the user reconnects. We handle both cases:
    // 1. Wallet not deployed → deploy it
    // 2. Wallet already deployed → just use unwrapped signature

    const isDeployed = await isSmartWalletDeployed(sessionClient, opts.userClient.account.address)

    if (!isDeployed) {
      // Wallet needs deployment - this is the first-time setup
      await deploySmartWallet(
        sessionClient,
        opts.userClient.account.address,
        factoryAddress,
        factoryCalldata
      )

      // Verify deployment succeeded by checking again
      const isNowDeployed = await isSmartWalletDeployed(sessionClient, opts.userClient.account.address)
      if (!isNowDeployed) {
        throw new Error(
          `Wallet deployment appeared to succeed but contract code not found at ${opts.userClient.account.address}`
        )
      }

      // Wait a bit longer for bundler/paymaster state to update
      // After deployment, bundlers may cache that the account needs factory/factoryData
      // We need to give them time to refresh their state
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    // else: Wallet already deployed, just use the unwrapped signature

    // Use the unwrapped signature (wallet is now deployed and can validate via ERC-1271)
    finalSignature = signature
  }

  // Session account submits the signature + call to World
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

    // If AA10 error occurs here, it means the wallet was just deployed and bundler hasn't updated
    // Guide the user to retry
    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed")) {
      throw new Error(
        `Smart wallet was just deployed. Please try the operation again in a moment. (If you just added a new address in Coinbase Wallet, this is expected on first use.)`
      )
    }

    // Re-throw other errors as-is
    throw error
  }
}
