import { Hex, encodeFunctionData, Client } from "viem"
import { waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import { systemsConfig as worldSystemsConfig } from "@latticexyz/world/mud.config"
import { unlimitedDelegationControlId, ConnectedClient } from "../../types"
import { callWithSignature } from "../patterns/call-with-signature"
import { SetupSessionBaseParams, deploySessionAccount } from "./shared"

export type SetupSessionEOAParams = SetupSessionBaseParams & {
  /** Public client for reading blockchain state */
  client: Client
  /** User's connected EOA wallet client */
  userClient: ConnectedClient
  /** Whether to register delegation (default: true) */
  registerDelegation?: boolean
}

/**
 * Setup session for EOA wallets
 *
 * EOA Flow (CallWithSignature Pattern):
 * 1. User signs an EIP-712 message off-chain (free, no gas)
 * 2. Session account submits the signature + call to World
 * 3. World.callWithSignature() validates the signature
 * 4. If valid, World registers delegation as the user
 * 5. Deploy session account if needed
 *
 * This enables gasless transactions - the user only signs a message,
 * and the session account pays gas via paymaster to submit it.
 *
 * **Why this approach?**
 * EOAs can't use paymasters directly (they're not smart accounts), so we use
 * the CallWithSignature pattern to enable gasless transactions.
 *
 * @param params Setup parameters for EOA
 */
export async function setupSessionEOA({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true,
  onStatus
}: SetupSessionEOAParams): Promise<void> {
  const sessionAddress = sessionClient.account.address
  const userAddress = userClient.account.address

  console.log("[entrykit-drawbridge] EOA setup:", { userAddress })

  const txs: Hex[] = []

  if (registerDelegation) {
    const tx = await callWithSignature({
      client: sessionClient,
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
    txs.push(tx)
  }

  if (!txs.length) {
    // No delegation to register, just deploy session account
    await deploySessionAccount(sessionClient, onStatus)
    onStatus?.({ type: "complete", message: "Session setup complete!" })
    return
  }

  onStatus?.({ type: "registering_delegation", message: "Setting up session..." })

  for (const hash of txs) {
    const receipt = await getAction(
      client,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({ hash })

    if (receipt.status === "reverted") {
      throw new Error("Delegation registration transaction reverted")
    }
  }

  // Deploy session account if needed
  await deploySessionAccount(sessionClient, onStatus)

  console.log("[entrykit-drawbridge] EOA setup complete")
  onStatus?.({ type: "complete", message: "Session setup complete!" })
}
