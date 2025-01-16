import Fastify from 'fastify'
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';

import { PORT } from '@config';

import ping from '@routes/test/ping';
import enter from '@routes/room/enter';

const fastify = Fastify({   logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
 })

// Register plugins
fastify.register(formbody);
fastify.register(cors, {
  origin: '*', // Allow all origins (restrict for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
});

// Register routes
fastify.register(ping)
fastify.register(enter)

// Start the server
const start = async (port: number) => {
    try {
        await fastify.listen({ port })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start(PORT)