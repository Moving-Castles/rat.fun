import { OffChainMessage } from "./types";

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

export function broadcast(messageObject: OffChainMessage): void {
  Object.keys(wsConnections).forEach((ratId) => {
    sendToClient(ratId, messageObject);
  });
} 