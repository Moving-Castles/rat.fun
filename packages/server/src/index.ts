// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
import "./modules/sentry/instrument.js"
import * as Sentry from "@sentry/node"

import Fastify from 'fastify'
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';

import { PORT } from '@config';

import ping from '@routes/test/ping';
import debug from '@routes/test/debug';
import enterPvP from '@routes/room/enter-pvp';
import enter from '@routes/room/enter';

import { initDB } from '@routes/room/enter-pvp/roomStore';

const fastify = Fastify({   logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
 })

// Monitoring 
Sentry.setupFastifyErrorHandler(fastify);

// Room store
initDB();

// Register plugins
fastify.register(formbody);
fastify.register(cors, {
  origin: '*', // Allow all origins (restrict for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
});

// Register routes
fastify.register(ping)
fastify.register(debug)
fastify.register(enter)
fastify.register(enterPvP)

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