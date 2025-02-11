// Store active WebSocket connections
export const wsConnections: { [ratId: string]: WebSocket } = {};

export function sendToRat(ratId: string, topic: string, message: object | string): void {
  console.log("Sending to rat", ratId, topic);
  console.log('Object.keys(wsConnections)', Object.keys(wsConnections));
  const ratWebSocket = wsConnections[ratId];
  const messageObject = {topic, message,};
  if (ratWebSocket) {
    ratWebSocket.send(JSON.stringify(messageObject));
  } else {
    console.error(`No active WebSocket connection for Rat ID: ${ratId}`);
  }
}

export function broadcast(topic: string, message: object | string): void {
  Object.keys(wsConnections).forEach((ratId) => {
    sendToRat(ratId, topic, message);
  });
}