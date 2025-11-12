import { Hex, encodeFunctionData, zeroAddress } from "viem"
import { sendUserOperation, waitForUserOperationReceipt } from "viem/account-abstraction"
import { waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import { systemsConfig as worldSystemsConfig } from "@latticexyz/world/mud.config"
import { unlimitedDelegationControlId, worldAbi, SessionClient } from "../core/types"
import { callWithSignature } from "../utils/callWithSignature"
import { defineCall } from "../utils/defineCall"

export type SetupSessionParams = {
  client: any
  userClient: any
  sessionClient: SessionClient
  worldAddress: Hex
  registerDelegation?: boolean
}

/**
 * Setup session by registering delegation and deploying session account
 *
 * Flow differs based on wallet type:
 *
 * **Smart Account Wallet:**
 * - Sends user operation to register delegation
 * - User's smart account submits the operation
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
  registerDelegation = true
}: SetupSessionParams): Promise<void> {
  const sessionAddress = sessionClient.account.address

  console.log("setting up session", userClient)

  if (userClient.account.type === "smart") {
    // ===== Smart Account Flow =====
    // User's wallet is already a smart account (e.g., Safe, Biconomy)
    // Can submit user operations directly

    const calls = []

    if (registerDelegation) {
      console.log("registering delegation")
      calls.push(
        defineCall({
          to: worldAddress,
          abi: worldAbi,
          functionName: "registerDelegation",
          args: [sessionAddress, unlimitedDelegationControlId, "0x"]
        })
      )
    }

    if (!calls.length) return

    console.log("setting up account with", calls, userClient)
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls })
    console.log("got user op hash", hash)

    const receipt = await getAction(
      userClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash })
    console.log("got user op receipt", receipt)

    if (!receipt.success) {
      console.error("not successful?", receipt)
    }
  } else {
    // ===== EOA Flow (CallWithSignature) =====
    // User's wallet is a regular EOA (MetaMask, etc.)
    // Uses MUD's CallWithSignature pattern for gasless execution:
    //   1. User signs message (free, no gas)
    //   2. Session account submits signature + call (pays gas via paymaster)
    //   3. World validates signature and executes as user

    const txs: Hex[] = []

    if (registerDelegation) {
      console.log("registering delegation")
      const tx = await callWithSignature({
        client,
        userClient,
        sessionClient,
        worldAddress,
        systemId: worldSystemsConfig.systems.RegistrationSystem.systemId,
        callData: encodeFunctionData({
          abi: IBaseWorldAbi,
          functionName: "registerDelegation",
          args: [sessionAddress, unlimitedDelegationControlId, "0x"]
        })
      })
      console.log("got delegation tx", tx)
      txs.push(tx)
    }

    if (!txs.length) return

    console.log("waiting for", txs.length, "receipts")
    for (const hash of txs) {
      const receipt = await getAction(
        client,
        waitForTransactionReceipt,
        "waitForTransactionReceipt"
      )({ hash })
      console.log("got tx receipt", receipt)
      if (receipt.status === "reverted") {
        console.error("tx reverted?", receipt)
      }
    }
  }

  // ===== Deploy Session Account =====
  // Session account needs to be deployed before it can be used.
  // We deploy it eagerly here (rather than lazily on first use) so downstream
  // code can assume the account exists and has a deterministic address.

  if (!(await sessionClient.account.isDeployed?.())) {
    console.log("creating session account by sending empty user op")

    // Send empty user operation to trigger account deployment
    // The bundler/EntryPoint will deploy the account as part of executing this operation
    const hash = await getAction(
      sessionClient,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls: [{ to: zeroAddress }]
    })

    const receipt = await getAction(
      sessionClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash })
    console.log("got user op receipt", receipt)
  }
}
