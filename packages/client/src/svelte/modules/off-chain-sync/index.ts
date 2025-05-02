import type { OffChainMessage } from "@server/modules/websocket/types"
import type { SetupWalletNetworkResult } from "@mud/setupWalletNetwork"
import { ENVIRONMENT } from "@mud/enums"
import { OFFCHAIN_VALIDATION_MESSAGE } from "@server/config";
import {
  clientList,
  newEvent,
  latestEvents,
  roundTriptime,
  websocketConnected,
} from "@modules/off-chain-sync/stores"

const MAX_RECONNECTION_DELAY = 30000 // Maximum delay of 30 seconds

let socket: WebSocket
let reconnectAttempts = 0
let roundTripStart = 0

export function initOffChainSync(environment: ENVIRONMENT, playerId: string) {
  console.log("Initializing off chain sync", environment, playerId)

  let url = `ws://localhost:3131/ws/${playerId}`

  if ([ENVIRONMENT.PYROPE, ENVIRONMENT.GARNET].includes(environment)) {
    url = `wss://reality-model-1.mc-infra.com/ws/${playerId}`
  }

  socket = new WebSocket(url)

  socket.onopen = () => {
    console.log("WebSocket connected")
    websocketConnected.set(true)
    reconnectAttempts = 0 // Reset attempts on successful connection
  }

  socket.onmessage = (message: MessageEvent<string>) => {
    console.log("Received message:", message)
    const messageContent = JSON.parse(message.data) as OffChainMessage
    // console.log("Received outcome:", messageContent)

    // Update client list when players connect/disconnect
    if (messageContent.topic === "clients__update") {
      clientList.set(messageContent.message as string[])
      return
    }

    if (messageContent.topic === "test") {
      roundTriptime.set(performance.now() - roundTripStart)
      return
    }

    // Pass message to stores
    newEvent.set(messageContent)
    latestEvents.update(state => {
      return [...state, messageContent]
    })
  }

  socket.onclose = message => {
    console.log("WebSocket closed:", message)
    console.log("Reconnecting...")
    attemptReconnect(environment, playerId)
  }

  socket.onerror = error => {
    console.error("WebSocket error:", error)
    socket.close() // Ensure connection is properly closed before reconnecting
  }
}

function attemptReconnect(environment: ENVIRONMENT, playerId: string) {
  const delay = Math.min(
    1000 * Math.pow(2, reconnectAttempts),
    MAX_RECONNECTION_DELAY
  )
  reconnectAttempts += 1

  setTimeout(() => {
    console.log(`Reconnecting attempt ${reconnectAttempts}...`)
    initOffChainSync(environment, playerId)
  }, delay)
}

export function ping() {
  roundTripStart = performance.now()
  socket.send(
    JSON.stringify({
      topic: "test",
      message: "ping",
    })
  )
}

export async function sendChatMessage(
  walletNetwork: SetupWalletNetworkResult,
  message: string
) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "chat__message",
        message: message,
        signature: signature,
      })
    )
  } else {
    console.error("No socket")
  }
}

export async function sendDeployRatMessage(walletNetwork: SetupWalletNetworkResult) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "rat__deploy",
        signature: signature,
      })
    )
  } else {
    console.error("No socket")
  }
}

export async function sendLiquidateRatMessage(walletNetwork: SetupWalletNetworkResult, ratName: string) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "rat__liquidate",
        ratName: ratName,
        signature: signature, 
      })
    )
  } else {
    console.error("No socket")
  }
}

export async function sendLiquidateRoomMessage(walletNetwork: SetupWalletNetworkResult) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "room__liquidation",
        signature: signature,
      })
    )
  }
}

