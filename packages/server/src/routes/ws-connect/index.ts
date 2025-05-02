import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocketParams, OffChainMessage } from '@modules/websocket/types';
import { schema } from '@routes/ws-connect/schema';
import { broadcast, wsConnections } from '@modules/websocket';
import { v4 as uuidv4 } from 'uuid';

// Message store
import { getMessages } from '@modules/message-store';

// Error handling
import { handleError } from './errorHandling';
import { handleMessage } from './messageHandling';

async function routes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/:playerId',
    { websocket: true, schema: schema },
    async (socket, req: FastifyRequest<WebSocketParams>) => {
      const { playerId } = req.params;

      try {
        // Store the WebSocket connection
        wsConnections[playerId] = socket;
        // console.log(`WebSocket connected for Player ID: ${playerId}`);
        // console.log('Object.keys(wsConnections)', Object.keys(wsConnections))

        // Send last 30 messages to the newly connected user
        const lastMessages = await getMessages(30);
        for (const message of lastMessages) {
          socket.send(JSON.stringify(message));
        }

        // Broadcast updated client list to all connected clients
        broadcast({
          id: uuidv4(),
          topic: "clients__update",
          message: Object.keys(wsConnections),
          timestamp: Date.now()
        }).catch(console.error);

        // Add message handler
        socket.on('message', async (message: OffChainMessage) => {
          try {
            const data = JSON.parse(message.toString());
            await handleMessage(data, socket);
          } catch (error) {
            handleError(error, socket);
          }
        });

        socket.on('close', async () => {
          // console.log(`WebSocket closed for Player ID: ${playerId}`);
          delete wsConnections[playerId]; // Clean up connection
          // Broadcast updated client list to all connected clients
          await broadcast({
            id: uuidv4(),
            topic: "clients__update",
            message: Object.keys(wsConnections),
            timestamp: Date.now()
          });
        });
      } catch (error) {
        handleError(error, socket);
      }
    }
  );
}

export default routes;
