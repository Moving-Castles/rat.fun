import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocketParams, OffChainMessage } from '@modules/websocket/types';
import { schema } from '@routes/ws-connect/schema';
import { broadcast, wsConnections } from '@modules/websocket';

// Signature
import { getSenderId } from '@modules/signature';

// MUD
import { getPlayerName } from '@modules/mud/getOnchainData';
import { components} from '@modules/mud/initMud';

// Error handling
import { handleError } from './errorHandling';

async function routes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/:playerId',
    { websocket: true, schema: schema },
    (socket, req: FastifyRequest<WebSocketParams>) => {
      const { playerId } = req.params;

      try {
        // Store the WebSocket connection
        wsConnections[playerId] = socket;
        console.log(`WebSocket connected for Player ID: ${playerId}`);
        console.log('Object.keys(wsConnections)', Object.keys(wsConnections))

        // Broadcast updated client list to all connected clients
        broadcast("clients__update", Object.keys(wsConnections));

        // Add ping-pong handler
        socket.on('message', (message: OffChainMessage) => {
          try {
            const data = JSON.parse(message.toString());
            // Test
            if (data.topic === 'test') {
              const newMessage: OffChainMessage = {
                topic: 'test',
                message: 'pong',
                timestamp: Date.now()
              }
              socket.send(JSON.stringify(newMessage));
            }
            // Chat message
            if (data.topic === 'chat__message') {
              console.log('chat__message', data)

              const senderId = getSenderId(data.signature, data.message)
              const playerName = getPlayerName(senderId, components.Name)

              const newMessage: OffChainMessage = {
                topic: 'chat__message',
                playerName: playerName,
                message: data.message,
                timestamp: Date.now()
              }
              broadcast("chat__message", newMessage);
            }
          } catch (error) {
            handleError(error, socket);
          }
        });

        socket.on('close', () => {
          console.log(`WebSocket closed for Player ID: ${playerId}`);
          delete wsConnections[playerId]; // Clean up connection
          // Broadcast updated client list to all connected clients
          broadcast("clients__update", Object.keys(wsConnections));
        });
      } catch (error) {
        handleError(error, socket);
      }
    }
  );
}

export default routes;
