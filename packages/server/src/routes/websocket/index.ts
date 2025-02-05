import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/websocket/schema';
import { wsConnections } from './store';

// Define the type of the request parameters
interface WebSocketParams {
  Params: {
    ratId: string;
  };
}

async function routes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/:ratId',
    { websocket: true, schema: schema },
    (socket, req: FastifyRequest<WebSocketParams>) => {
      const { ratId } = req.params;

      // Store the WebSocket connection
      wsConnections[ratId] = socket;

      socket.on('close', () => {
        console.log(`WebSocket closed for Rat ID: ${ratId}`);
        delete wsConnections[ratId]; // Clean up connection
        // TODO: broadcast to all connected clients
      });

      console.log(`WebSocket connected for Rat ID: ${ratId}`);
      // TODO: broadcast to all connected clients
    }
  );
}

export default routes;
