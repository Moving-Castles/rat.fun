import { get } from "svelte/store"
import { signRequest } from "$lib/modules/signature"
import { websocketConnected } from "./stores"

// Reference to the active WebSocket connection
let socket: WebSocket | null = null

/**
 * Set the WebSocket reference for sending messages.
 * Called from off-chain-sync index when connection is established.
 */
export function setSocket(ws: WebSocket | null) {
  socket = ws
}

/**
 * Get the current socket (for internal use)
 */
export function getSocket(): WebSocket | null {
  return socket
}

/**
 * Send a chat message through the WebSocket connection.
 * The message is signed by the user's wallet for verification.
 *
 * @param content - The message content to send
 * @throws Error if not connected or if signing fails
 */
export async function sendChatMessage(content: string): Promise<void> {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to server")
  }

  if (!get(websocketConnected)) {
    throw new Error("WebSocket not connected")
  }

  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error("Message cannot be empty")
  }

  if (trimmed.length > 280) {
    throw new Error("Message exceeds maximum length of 280 characters")
  }

  // Sign the message for verification
  const signedRequest = await signRequest({ content: trimmed })

  // Send to server
  socket.send(
    JSON.stringify({
      topic: "chat__send",
      content: trimmed,
      info: signedRequest.info,
      signature: signedRequest.signature
    })
  )
}

/**
 * Send the player's display name to the server.
 * This updates how the player appears in chat messages.
 *
 * @param name - The display name to set
 */
export function sendPlayerName(name: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return
  }

  const trimmed = name.trim().slice(0, 32)
  if (!trimmed) return

  socket.send(
    JSON.stringify({
      topic: "player__name",
      name: trimmed
    })
  )
}
