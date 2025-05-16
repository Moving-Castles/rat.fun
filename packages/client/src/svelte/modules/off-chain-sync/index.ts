import type { OffChainMessage } from "@server/modules/types"
import type { SetupWalletNetworkResult } from "@mud/setupWalletNetwork"
import { ENVIRONMENT } from "@mud/enums"
import { OFFCHAIN_VALIDATION_MESSAGE } from "@server/config";
import {
  clientList,
  latestEvents,
  roundTriptime,
  websocketConnected,
} from "@modules/off-chain-sync/stores"

const MAX_RECONNECTION_DELAY = 30000 // Maximum delay of 30 seconds
const MAX_EVENTS = 200

let socket: WebSocket
let reconnectAttempts = 0
let roundTripStart = 0
let reconnectTimeout: NodeJS.Timeout | null = null

export function initOffChainSync(environment: ENVIRONMENT, playerId: string) {
  console.log("Initializing off chain sync", environment, playerId)

  // Clean up any existing connection
  if (socket) {
    try {
      socket.close();
    } catch (e) {
      console.error('Error closing existing socket:', e);
    }
  }

  // Clear any pending reconnection
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

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
    latestEvents.update(state => {
      // Check if message with this ID already exists
      if (state.some(event => event.id == messageContent.id)) {
        console.log("Duplicate message id found:", messageContent.id)
        return state
      }
      // Add new message and limit array to MAX_EVENTS items
      const newState = [...state, messageContent]
      return newState.slice(-MAX_EVENTS)
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
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECTION_DELAY);
  reconnectAttempts++;

  reconnectTimeout = setTimeout(() => {
    console.log(`Attempting to reconnect (attempt ${reconnectAttempts})...`);
    initOffChainSync(environment, playerId);
  }, delay);
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

/****************
 * CHAT MESSAGE
 *****************/

export async function sendChatMessage(
  walletNetwork: SetupWalletNetworkResult,
  level: string,
  message: string
) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "chat__message",
        level: level,
        message: message,
        signature: signature,
      })
    )
  } else {
    console.error("No socket")
  }
}

/****************
 * RAT DEPLOYMENT
 *****************/

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

/****************
 * RAT LIQUIDATION
 *****************/

export async function sendLiquidateRatMessage(walletNetwork: SetupWalletNetworkResult, ratId: string) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "rat__liquidate",
        ratId: ratId,
        signature: signature, 
      })
    )
  } else {
    console.error("No socket")
  }
}

/****************
 * ROOM LIQUIDATION
 *****************/

export async function sendLiquidateRoomMessage(walletNetwork: SetupWalletNetworkResult, roomId: string) {
  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE
  })

  if (socket) {
    socket.send(
      JSON.stringify({
        topic: "room__liquidation",
        roomId: roomId,        
        signature: signature,
      })
    )
  }
}

