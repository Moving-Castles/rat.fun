import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/ws-connect/schema';
import { broadcast, wsConnections } from '@modules/websocket';

// Define the type of the request parameters
interface WebSocketParams {
  Params: {
    ratId: string;
  };
}

type Message = {
  topic: string;
  message: string;
}

async function routes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/:ratId',
    { websocket: true, schema: schema },
    (socket, req: FastifyRequest<WebSocketParams>) => {
      const { ratId } = req.params;

      // Store the WebSocket connection
      wsConnections[ratId] = socket;
      console.log(`WebSocket connected for Rat ID: ${ratId}`);

      console.log('Object.keys(wsConnections)', Object.keys(wsConnections))

      // Broadcast updated client list to all connected clients
      broadcast("clients__update", Object.keys(wsConnections));

      // Add ping-pong handler
      socket.on('message', (message: Message) => {
        const data = JSON.parse(message.toString());
        // console.log('ping from', ratId)
        if (data.topic === 'test') {
          socket.send(JSON.stringify({ topic: 'test', message: 'pong' }));
        }
      });

      socket.on('close', () => {
        console.log(`WebSocket closed for Rat ID: ${ratId}`);
        delete wsConnections[ratId]; // Clean up connection
        // Broadcast updated client list to all connected clients
        broadcast("clients__update", Object.keys(wsConnections));
      });
    }
  );
}

export default routes;
