import type { ServerMessage } from "@modules/types"

// Store active WebSocket connections by playerId
export const wsConnections: Map<string, WebSocket> = new Map()

// Store player names for display (playerId -> name)
export const playerNames: Map<string, string> = new Map()

/**
 * Set a player's display name
 */
export function setPlayerName(playerId: string, name: string): void {
  playerNames.set(playerId, name)
}

/**
 * Get a player's display name, falling back to shortened ID
 */
export function getPlayerName(playerId: string): string {
  return playerNames.get(playerId) ?? shortenAddress(playerId)
}

/**
 * Shorten an address for display
 */
function shortenAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Send a message to a specific client
 */
export function sendToClient(playerId: string, message: ServerMessage): void {
  const playerWebSocket = wsConnections.get(playerId)
  if (playerWebSocket) {
    try {
      // Check if the WebSocket is still open before sending
      // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
      if (playerWebSocket.readyState === 1) {
        playerWebSocket.send(JSON.stringify(message))
      } else {
        // Remove the closed connection
        wsConnections.delete(playerId)
      }
    } catch (error) {
      console.error(`Failed to send message to Player ID ${playerId}:`, error)
      // Remove the broken connection
      wsConnections.delete(playerId)
    }
  }
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcast(message: ServerMessage): void {
  for (const playerId of wsConnections.keys()) {
    sendToClient(playerId, message)
  }
}

/**
 * Get list of connected player IDs
 */
export function getConnectedPlayerIds(): string[] {
  return Array.from(wsConnections.keys())
}
