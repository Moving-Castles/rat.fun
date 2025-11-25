import { ENVIRONMENT } from "$lib/mud/enums"
import { clientList, websocketConnected } from "$lib/modules/off-chain-sync/stores"
import { signRequest } from "$lib/modules/signature"
import {
  PUBLIC_DEVELOPMENT_WEBSOCKET_HOST,
  PUBLIC_BASE_SEPOLIA_WEBSOCKET_HOST,
  PUBLIC_BASE_WEBSOCKET_HOST
} from "$env/static/public"
import { errorHandler, WebSocketError } from "$lib/modules/error-handling"

type ClientsUpdateMessage = {
  id: string
  topic: "clients__update"
  message: string[]
  timestamp: number
}

const MAX_RECONNECTION_DELAY = 30000 // Maximum delay of 30 seconds

let socket: WebSocket | null = null
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

// Store environment and playerId for reconnection
let currentEnvironment: ENVIRONMENT | null = null
let currentPlayerId: string | null = null

export async function initOffChainSync(environment: ENVIRONMENT, playerId: string) {
  // Store for reconnection
  currentEnvironment = environment
  currentPlayerId = playerId

  // Clean up any existing connection
  if (socket) {
    try {
      socket.close()
    } catch (e) {
      errorHandler(new WebSocketError(`Error closing existing socket: ${e}`))
    }
  }

  // Clear any pending reconnection
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  // Sign the connection request
  const signedRequest = await signRequest({ action: "connect", playerId })

  // Build query params with signed request
  const queryParams = new URLSearchParams({
    data: encodeURIComponent(JSON.stringify(signedRequest.data)),
    info: encodeURIComponent(JSON.stringify(signedRequest.info)),
    signature: signedRequest.signature
  })

  // Determine WebSocket URL based on environment
  let baseUrl = ""
  switch (environment) {
    case ENVIRONMENT.BASE_SEPOLIA:
      baseUrl = `wss://${PUBLIC_BASE_SEPOLIA_WEBSOCKET_HOST}`
      break
    case ENVIRONMENT.BASE:
      baseUrl = `wss://${PUBLIC_BASE_WEBSOCKET_HOST}`
      break
    default:
      // Default to localhost:3232 if env var not set
      baseUrl = `ws://${PUBLIC_DEVELOPMENT_WEBSOCKET_HOST || "localhost:3232"}`
  }

  const url = `${baseUrl}/ws/${playerId}?${queryParams.toString()}`

  socket = new WebSocket(url)

  socket.onopen = () => {
    websocketConnected.set(true)
    reconnectAttempts = 0 // Reset attempts on successful connection
  }

  socket.onmessage = (message: MessageEvent<string>) => {
    const messageContent = JSON.parse(message.data) as ClientsUpdateMessage

    // Update client list when players connect/disconnect
    if (messageContent.topic === "clients__update") {
      clientList.set(messageContent.message)
    }
  }

  socket.onclose = event => {
    websocketConnected.set(false)
    // Only attempt reconnect if not a deliberate close (code 4001 = auth failure)
    if (event.code !== 4001) {
      attemptReconnect()
    } else {
      errorHandler(new WebSocketError(`WebSocket authentication failed: ${event.reason}`))
    }
  }

  socket.onerror = (error: Event) => {
    errorHandler(new WebSocketError(undefined, error))
    socket?.close() // Ensure connection is properly closed before reconnecting
  }
}

function attemptReconnect() {
  if (!currentEnvironment || !currentPlayerId) {
    return
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
  }

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECTION_DELAY)
  reconnectAttempts++

  reconnectTimeout = setTimeout(() => {
    if (currentEnvironment && currentPlayerId) {
      initOffChainSync(currentEnvironment, currentPlayerId)
    }
  }, delay)
}

export function disconnectOffChainSync() {
  currentEnvironment = null
  currentPlayerId = null

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (socket) {
    socket.close()
    socket = null
  }

  websocketConnected.set(false)
  clientList.set([])
}
