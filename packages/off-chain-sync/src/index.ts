import uWS from "uWebSockets.js"
import { v4 as uuidv4 } from "uuid" // Import UUID generator
import type { ClientData } from "./types"

// Extend the WebSocket type with a generic type parameter for custom properties
type ExtendedWebSocket = uWS.WebSocket<unknown> & {
  clientId: string
}

// Maintain a list of connected clients
const clients: Set<ExtendedWebSocket> = new Set()

// Create a uWebSockets server instance
const app = uWS.App({})

// Function to broadcast the current list of client IDs to all connected clients
const broadcastClientList = () => {
  const clientList = Array.from(clients).map(client => client.clientId)
  const message = JSON.stringify({ topic: "clientList", clients: clientList })

  clients.forEach(client => {
    client.send(message)
  })
}

// Set up the WebSocket server
app.ws<unknown>("/*", {
  open: ws => {
    // Safely extend the WebSocket instance with a custom property
    const extendedWs = ws as ExtendedWebSocket
    const clientId = uuidv4()

    extendedWs.clientId = clientId
    clients.add(extendedWs)

    // Relay user client ID
    extendedWs.send(JSON.stringify({ topic: "clientId", clientId }))

    // Broadcast the updated list of connected clients
    broadcastClientList()
  },
  message: (ws, message) => {
    // Safely cast to ExtendedWebSocket
    const extendedWs = ws as ExtendedWebSocket

    // console.log("message received:", message)

    // Parse the incoming message
    try {
      const data: ClientData = JSON.parse(Buffer.from(message).toString())

      // Include the client's unique ID in the data to broadcast
      const broadcastData = {
        ...data,
        clientId: extendedWs.clientId,
      }

      console.log(clients)

      // Broadcast the data to all other connected clients
      clients.forEach(client => {
        if (client !== extendedWs) {
          client.send(JSON.stringify(broadcastData))
        }
      })
    } catch (err) {
      console.error("Error parsing message:", err)
    }
  },
  close: ws => {
    // Safely cast to ExtendedWebSocket
    const extendedWs = ws as ExtendedWebSocket
    clients.delete(extendedWs)
    // console.log(`Client disconnected: ${extendedWs.clientId}`)

    // Broadcast the updated list of connected clients
    broadcastClientList()
  },
})

// Start the server on port 9001
app.listen(9001, token => {
  if (token) {
    console.log("WebSocket server listening on port 9001")
  } else {
    console.error("Failed to start server")
  }
})
