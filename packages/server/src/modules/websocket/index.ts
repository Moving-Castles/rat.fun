import { OffChainMessage } from "@modules/types"
import { storeMessage } from "@modules/message-store"

// Store active WebSocket connections
export const wsConnections: { [playerId: string]: WebSocket } = {}

export function sendToClient(playerId: string, messageObject: OffChainMessage): void {
  // console.log(`Attempting to send message to Player ID: ${playerId}`)
  const playerWebSocket = wsConnections[playerId]
  if (playerWebSocket) {
    // console.log(
    //   `WebSocket found for Player ID ${playerId}, readyState: ${playerWebSocket.readyState}`
    // )
    try {
      // Check if the WebSocket is still open before sending
      // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
      if (playerWebSocket.readyState === 1) {
        // console.log(`Sending message to Player ID ${playerId}...`)
        playerWebSocket.send(JSON.stringify(messageObject))
        // console.log(`Message sent successfully to Player ID ${playerId}`)
      } else {
        // console.log(
        //   `WebSocket connection for Player ID ${playerId} is not open (state: ${playerWebSocket.readyState})`
        // )
        // Remove the closed connection
        delete wsConnections[playerId]
      }
    } catch (error) {
      console.error(`Failed to send message to Player ID ${playerId}:`, error)
      // Remove the broken connection
      delete wsConnections[playerId]
    }
  } else {
    // console.log(`No active WebSocket connection for Player ID: ${playerId}`)
  }
}

export async function broadcast(messageObject: OffChainMessage): Promise<void> {
  // console.log(`Starting broadcast for topic: ${messageObject.topic}`)
  // console.log(`Active WebSocket connections: ${Object.keys(wsConnections).length}`)

  // Store the message in the message store
  if (!["clients__update", "test"].includes(messageObject.topic)) {
    try {
      // console.log("Storing message in message store...")
      await storeMessage(messageObject)
      // console.log("Message stored successfully")
    } catch (error) {
      // Log the error but don't fail the broadcast
      console.error("Failed to store message:", error)
    }
  }

  // Broadcast to all connected clients
  // console.log("Broadcasting to connected clients...")
  Object.keys(wsConnections).forEach(playerId => {
    sendToClient(playerId, messageObject)
  })
  // console.log("Broadcast completed")
}
