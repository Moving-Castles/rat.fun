import { ENVIRONMENT } from "@mud/enums"
import { clientList, newEvent, roundTriptime } from "@modules/off-chain-sync/stores"
import { MessageContent } from "./types"

let socket: WebSocket
let reconnectAttempts = 0;
const MAX_RECONNECTION_DELAY = 30000; // Maximum delay of 30 seconds
let roundTripStart = 0

export function initOffChainSync(environment: ENVIRONMENT, ratId: string) {
  console.log("Initializing off chain sync", environment, ratId)

  let url = `ws://localhost:3131/ws/${ratId}`

  if ([ENVIRONMENT.GARNET].includes(environment)) {
    url = `wss://reality-model-1.mc-infra.com/ws/${ratId}`
  }

  socket = new WebSocket(url)

  socket.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0; // Reset attempts on successful connection
  };

  socket.onmessage =(message: MessageEvent<string>) => {
    // console.log("Received message:", message)
    const messageContent = JSON.parse(message.data) as MessageContent
    // console.log("Received outcome:", messageContent)

    // Update client list when players connect/disconnect
    if (messageContent.topic === "clients__update") {
      clientList.set(messageContent.message as string[])
      return
    }

    if (messageContent.topic === "test") {
      roundTriptime.set(performance.now() - roundTripStart)
      return
    }

    // Pass message to store
    newEvent.set(messageContent)
  }

  socket.onclose = message => {
    console.log('WebSocket closed:', message);
    console.log('Reconnecting...');
    attemptReconnect(environment, ratId);
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket.close(); // Ensure connection is properly closed before reconnecting
  };
}

function attemptReconnect(environment: ENVIRONMENT, ratId: string) {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECTION_DELAY);
  reconnectAttempts += 1;

  setTimeout(() => {
    console.log(`Reconnecting attempt ${reconnectAttempts}...`);
    initOffChainSync(environment, ratId);
  }, delay);
}

export function ping() {
  roundTripStart = performance.now()
  socket.send(JSON.stringify({
    topic: "test",
    message: "ping"
  }))
}
