import { Hex, encodeFunctionData, zeroAddress } from "viem"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getAction } from "viem/utils"
import { sendUserOperation, waitForUserOperationReceipt } from "viem/account-abstraction"
import { useEntryKitConfig } from "../EntryKitConfigProvider"
import { ConnectedClient, unlimitedDelegationControlId, worldAbi } from "../common"
import { waitForTransactionReceipt } from "viem/actions"
import { defineCall } from "../utils/defineCall"
import { Connector, useClient } from "wagmi"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import { callWithSignature } from "../utils/callWithSignature"
import { systemsConfig as worldSystemsConfig } from "@latticexyz/world/mud.config"

export function useSetupSession({
  connector,
  userClient
}: {
  connector: Connector
  userClient: ConnectedClient
}) {
  const queryClient = useQueryClient()
  const { chainId, worldAddress } = useEntryKitConfig()
  const client = useClient({ chainId })

  const mutationKey = ["setupSession", client?.chain.id, userClient.account.address]
  return useMutation({
    retry: 0,
    mutationKey,
    mutationFn: async ({
      sessionClient,
      registerDelegation
    }: {
      sessionClient: ConnectedClient
      registerDelegation: boolean
    }): Promise<void> => {
      if (!client) throw new Error("Client not ready.")
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

      // attempt to create session smart account instead of doing lazily
      // so downstream can expect the session account to exist
      await (async () => {
        if (await sessionClient.account.isDeployed?.()) return

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
      })()

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["getDelegation"] }),
        queryClient.invalidateQueries({ queryKey: ["getPrerequisites"] })
      ])
    }
  })
}
