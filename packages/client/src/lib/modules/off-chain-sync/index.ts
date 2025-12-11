import { get } from "svelte/store"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import { onlinePlayers, websocketConnected } from "$lib/modules/off-chain-sync/stores"
import { signRequest } from "$lib/modules/signature"
import {
  PUBLIC_DEVELOPMENT_WEBSOCKET_HOST,
  PUBLIC_BASE_SEPOLIA_WEBSOCKET_HOST,
  PUBLIC_BASE_WEBSOCKET_HOST
} from "$env/static/public"
import { errorHandler, WebSocketError } from "$lib/modules/error-handling"
import { players } from "$lib/modules/state/stores"
import { shortenAddress } from "$lib/modules/utils"
import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"
import {
  playerNotificationsEnabled,
  areNotificationsSuppressed
} from "$lib/modules/ui/notification-settings"

type ClientsUpdateMessage = {
  id: string
  topic: "clients__update"
  message: string[]
  timestamp: number
}

const MAX_RECONNECTION_DELAY = 30000 // Maximum delay of 30 seconds
const TOAST_RATE_LIMIT_MS = 60000 // Only show one connection toast per user per minute

let socket: WebSocket | null = null
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

// Store environment and playerId for reconnection
let currentEnvironment: ENVIRONMENT | null = null
let currentPlayerId: string | null = null
let hasReceivedInitialClientList = false

// Track last toast time per player to rate limit notifications
const lastToastTimeByPlayer = new Map<string, number>()

export async function initOffChainSync(environment: ENVIRONMENT, playerId: string) {
  // Store for reconnection
  currentEnvironment = environment
  currentPlayerId = playerId
  hasReceivedInitialClientList = false

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
      const currentPlayers = get(players)
      const previousOnlinePlayers = get(onlinePlayers)
      const previousIds = new Set(previousOnlinePlayers.map(p => p.id))

      const onlinePlayersList = messageContent.message
        .map(playerId => ({
          id: playerId,
          name: currentPlayers[playerId]?.name ?? shortenAddress(playerId)
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      // Show toast for new players joining (not for yourself, not on initial load, if enabled, not suppressed)
      if (
        hasReceivedInitialClientList &&
        playerNotificationsEnabled.current &&
        !areNotificationsSuppressed()
      ) {
        const now = Date.now()
        for (const player of onlinePlayersList) {
          if (!previousIds.has(player.id) && player.id !== currentPlayerId) {
            // Rate limit: only show one toast per player per minute
            const lastToastTime = lastToastTimeByPlayer.get(player.id) ?? 0
            if (now - lastToastTime >= TOAST_RATE_LIMIT_MS) {
              lastToastTimeByPlayer.set(player.id, now)
              toastManager.add({
                message: `${player.name} joined`,
                type: TOAST_TYPE.PLAYER_NOTIFICATION
              })
            }
          }
        }
      }

      hasReceivedInitialClientList = true
      onlinePlayers.set(onlinePlayersList)
    }
  }

  socket.onclose = event => {
    websocketConnected.set(false)

    // Handle different close scenarios
    if (event.code === 4001) {
      // Log auth failures to Sentry (no toast - WebSocketError is silent)
      errorHandler(new WebSocketError(`WebSocket authentication failed: ${event.reason}`))

      // Stale timestamp can be retried with fresh signature (common when browser was backgrounded)
      if (event.reason?.includes("Stale request timestamp")) {
        attemptReconnect()
      }
      // Other auth failures (invalid signature, etc.) - don't retry
    } else {
      // Non-auth failures - attempt reconnect
      attemptReconnect()
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
  onlinePlayers.set([])
  lastToastTimeByPlayer.clear()
}
