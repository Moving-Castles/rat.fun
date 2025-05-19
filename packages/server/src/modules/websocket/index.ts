import { OffChainMessage } from "@modules/types";
import { storeMessage } from "@modules/message-store";

// Store active WebSocket connections
export const wsConnections: { [playerId: string]: WebSocket } = {};

export function sendToClient(playerId: string, messageObject: OffChainMessage): void {
  const playerWebSocket = wsConnections[playerId];
  if (playerWebSocket) {
    playerWebSocket.send(JSON.stringify(messageObject));
  } else {
    console.error(`No active WebSocket connection for Player ID: ${playerId}`);
  }
}

export async function broadcast(messageObject: OffChainMessage): Promise<void> {
  // Store the message in the message store
  if(!["clients__update", "test"].includes(messageObject.topic)) {
    await storeMessage(messageObject);
  }
  
  // Broadcast to all connected clients
  Object.keys(wsConnections).forEach((playerId) => {
    sendToClient(playerId, messageObject);
  });
}