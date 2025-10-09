import type { OffChainMessage, SignedRequest, WebSocketInterface } from "@modules/types"
import { v4 as uuidv4 } from "uuid"
import { verifyRequest } from "@modules/signature"
import { getEntityName, getRatId } from "@modules/mud/getOnchainData"
import { broadcast, sendToClient } from "@modules/websocket"
import { systemCalls } from "@modules/mud/initMud"

const MASTER_KEY_CODE = process.env.MASTER_KEY_CODE

export async function handleMessage(
  request: SignedRequest<OffChainMessage>,
  socket: WebSocketInterface
): Promise<void> {
  switch (request.data.topic) {
    case "test":
      await handleTestMessage(socket)
      break
    case "chat__message":
      await handleChatMessage(request)
      break
    case "rat__deploy":
      await handleRatDeploy(request)
      break
    case "rat__liquidate":
      await handleRatLiquidate(request)
      break
    case "trip__liquidation":
      await handleTripLiquidation(request)
      break
    default:
      console.log("Unknown message topic:", request.data.topic)
  }
}

/****************
 * TEST MESSAGE
 *****************/

async function handleTestMessage(socket: WebSocketInterface): Promise<void> {
  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: "test",
    message: "pong",
    timestamp: Date.now()
  }
  socket.send(JSON.stringify(newMessage))
}

/****************
 * CHAT MESSAGE
 *****************/

async function handleChatMessage(request: SignedRequest<OffChainMessage>): Promise<void> {
  const senderId = await verifyRequest(request)

  const message = request.data.message
  if (message === MASTER_KEY_CODE) {
    await systemCalls.giveMasterKey(senderId)

    // Send a message to the player
    const newMessage: OffChainMessage = {
      id: uuidv4(),
      topic: "key__activation",
      playerName: getEntityName(senderId),
      message: "Supervisor mode activated",
      timestamp: Date.now()
    }

    sendToClient(senderId, newMessage)
    return
  }

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: "chat__message",
    playerName: getEntityName(senderId),
    message,
    timestamp: Date.now()
  }

  await broadcast(newMessage)
}

/****************
 * RAT DEPLOYMENT
 *****************/

async function handleRatDeploy(request: SignedRequest<OffChainMessage>): Promise<void> {
  const senderId = await verifyRequest(request)

  const ratId = getRatId(senderId)

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: "rat__deploy",
    playerName: getEntityName(senderId),
    ratName: getEntityName(ratId),
    timestamp: Date.now()
  }

  await broadcast(newMessage)
}

/****************
 * RAT LIQUIDATION
 *****************/

async function handleRatLiquidate(request: SignedRequest<OffChainMessage>): Promise<void> {
  const senderId = await verifyRequest(request)

  const ratName = getEntityName(request.data.ratId ?? "unknown rat")

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: "rat__liquidate",
    playerName: getEntityName(senderId),
    ratName,
    timestamp: Date.now()
  }

  await broadcast(newMessage)
}

/****************
 * TRIP LIQUIDATION
 *****************/

async function handleTripLiquidation(request: SignedRequest<OffChainMessage>): Promise<void> {
  const senderId = await verifyRequest(request)

  if (!senderId) {
    console.error("Missing senderId in trip liquidation message")
    return
  }

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: "trip__liquidation",
    tripIndex: request.data.tripIndex,
    tripId: request.data.tripId,
    playerName: getEntityName(senderId),
    timestamp: Date.now()
  }

  await broadcast(newMessage)
}
