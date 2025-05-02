// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
import "./modules/sentry/instrument.js"
import * as Sentry from "@sentry/node"

import Fastify from 'fastify'
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket'

import { initializeDB } from '@modules/message-store';

import { PORT } from '@config';

import ping from '@routes/test/ping';
import debug from '@routes/test/debug';
import enter from '@routes/room/enter';
import create from '@routes/room/create';
import wsConnect from '@routes/ws-connect';

const fastify = Fastify({ 
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
 })

// Monitoring 
Sentry.setupFastifyErrorHandler(fastify);

// Register plugins
fastify.register(websocket);
fastify.register(formbody);
fastify.register(cors, {
  origin: '*', // Allow all origins (restrict for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
});

// Register routes
fastify.register(ping)
fastify.register(debug)
fastify.register(enter)
fastify.register(create)
fastify.register(wsConnect)

// Start the server
const start = async (port: number) => {
    try {
        await fastify.listen({ port })
        // Initialize message store after server starts
        await initializeDB();
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start(PORT)