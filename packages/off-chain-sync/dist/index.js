"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uWebSockets_js_1 = __importDefault(require("uWebSockets.js"));
const uuid_1 = require("uuid"); // Import UUID generator
// Maintain a list of connected clients
const clients = new Set();
// Create a uWebSockets server instance
const app = uWebSockets_js_1.default.App({});
// Function to broadcast the current list of client IDs to all connected clients
const broadcastClientList = () => {
    const clientList = Array.from(clients).map(client => client.clientId);
    const message = JSON.stringify({ topic: "clientList", clients: clientList });
    clients.forEach(client => {
        client.send(message);
    });
};
// Set up the WebSocket server
app.ws("/*", {
    open: ws => {
        // Safely extend the WebSocket instance with a custom property
        const extendedWs = ws;
        const clientId = (0, uuid_1.v4)();
        extendedWs.clientId = clientId;
        clients.add(extendedWs);
        // Relay user client ID
        extendedWs.send(JSON.stringify({ topic: "clientId", clientId }));
        // Broadcast the updated list of connected clients
        broadcastClientList();
    },
    message: (ws, message) => {
        // Safely cast to ExtendedWebSocket
        const extendedWs = ws;
        // console.log("message received:", message)
        // Parse the incoming message
        try {
            const data = JSON.parse(Buffer.from(message).toString());
            // Include the client's unique ID in the data to broadcast
            const broadcastData = Object.assign(Object.assign({}, data), { clientId: extendedWs.clientId });
            // console.log(clients)
            // Broadcast the data to all other connected clients
            clients.forEach(client => {
                if (client !== extendedWs) {
                    client.send(JSON.stringify(broadcastData));
                }
            });
        }
        catch (err) {
            console.error("Error parsing message:", err);
        }
    },
    close: ws => {
        // Safely cast to ExtendedWebSocket
        const extendedWs = ws;
        clients.delete(extendedWs);
        // console.log(`Client disconnected: ${extendedWs.clientId}`)
        // Broadcast the updated list of connected clients
        broadcastClientList();
    },
});
// Start the server on port 9001
app.listen(9001, token => {
    if (token) {
        console.log("WebSocket server listening on port 9001");
    }
    else {
        console.error("Failed to start server");
    }
});
