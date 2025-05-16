import { OffChainMessage } from "@modules/types";
import { storeMessage } from "@modules/message-store";

// Store active WebSocket connections
export const wsConnections: { [ratId: string]: WebSocket } = {};

export function sendToClient(ratId: string, messageObject: OffChainMessage): void {
  const ratWebSocket = wsConnections[ratId];
  if (ratWebSocket) {
    ratWebSocket.send(JSON.stringify(messageObject));
  } else {
    console.error(`No active WebSocket connection for Rat ID: ${ratId}`);
  }
}

export async function broadcast(messageObject: OffChainMessage): Promise<void> {
  // Store the message in the message store
  if(!["clients__update", "test"].includes(messageObject.topic)) {
    await storeMessage(messageObject);
  }
  
  // Broadcast to all connected clients
  Object.keys(wsConnections).forEach((ratId) => {
    sendToClient(ratId, messageObject);
  });
} 