import { encodeFunctionData } from "viem"
import { waitForTransactionReceipt } from "viem/actions"
import { getAction } from "viem/utils"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import { systemsConfig as worldSystemsConfig } from "@latticexyz/world/mud.config"
import { unlimitedDelegationControlId, ConnectedClient, PublicClient } from "../../types"
import { callWithSignature } from "../patterns/call-with-signature"
import { SetupSessionBaseParams, deploySessionAccount } from "./shared"
import { logger } from "../../logger"

export type SetupSessionEOAParams = SetupSessionBaseParams & {
  /** Public client for reading blockchain state */
  publicClient: PublicClient
  /** User's connected EOA wallet client */
  userClient: ConnectedClient
}

/**
 * Setup session for EOA wallets
 *
 * EOA Flow (CallWithSignature Pattern):
 * 1. User signs an EIP-712 message off-chain (free, no gas)
 * 2. Session account submits the signature + call to World
 * 3. World.callWithSignature() or World.callWithSignatureAlt() validates the signature
 * 4. If valid, World registers delegation as the user
 * 5. Deploy session account
 *
 * @param params Setup parameters for EOA
 */
export async function setupSessionEOA({
  publicClient,
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}: SetupSessionEOAParams): Promise<void> {
  const sessionAddress = sessionClient.account.address
  const userAddress = userClient.account.address

  logger.log("[drawbridge] EOA setup:", { userAddress })

  onStatus?.({ type: "registering_delegation", message: "Setting up session..." })

  const hash = await callWithSignature({
    client: sessionClient,
    userClient,
    sessionClient,
    worldAddress,
    systemId: worldSystemsConfig.systems.RegistrationSystem.systemId,
    callData: encodeFunctionData({
      abi: IBaseWorldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    }),
    altDomain: false
  })

  const receipt = await getAction(
    publicClient,
    waitForTransactionReceipt,
    "waitForTransactionReceipt"
  )({ hash })

  if (receipt.status === "reverted") {
    throw new Error("Delegation registration transaction reverted")
  }

  // Deploy session account if needed
  await deploySessionAccount(sessionClient, onStatus)

  logger.log("[drawbridge] EOA setup complete")
  onStatus?.({ type: "complete", message: "Session setup complete!" })
}
