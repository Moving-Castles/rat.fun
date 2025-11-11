import { Hex, encodeFunctionData, zeroAddress, Client } from "viem"
import { sendUserOperation, waitForUserOperationReceipt } from "viem/account-abstraction"
import { waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import { systemsConfig as worldSystemsConfig } from "@latticexyz/world/mud.config"
import { unlimitedDelegationControlId, worldAbi, SessionClient } from "../common"
import { callWithSignature } from "../utils/callWithSignature"
import { defineCall } from "../utils/defineCall"

export type SetupSessionParams = {
  client: Client
  userClient: Client
  sessionClient: SessionClient
  worldAddress: Hex
  registerDelegation?: boolean
}

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
    // Set up session for smart account wallet
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
    // Set up session for EOAs
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

  // Deploy session smart account if not already deployed
  if (!(await sessionClient.account.isDeployed?.())) {
    console.log("creating session account by sending empty user op")
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
