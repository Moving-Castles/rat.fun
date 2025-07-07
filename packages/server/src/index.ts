import Fastify from "fastify"
import formbody from "@fastify/formbody"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"

import { initializeMessagesDB } from "@modules/message-store"
import { initializeNoncesDB } from "@modules/signature/db"

import { PORT } from "@config"

import ping from "@routes/test/ping"
import enter from "@routes/room/enter"
import create from "@routes/room/create"
import wsConnect from "@routes/ws-connect"
import healthz from "@routes/healthz"

const fastify = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger"
    }
  }
})

// Register plugins
fastify.register(websocket)
fastify.register(formbody)
fastify.register(cors, {
  origin: "*", // Allow all origins (restrict for production)
  methods: ["GET", "POST", "PUT", "DELETE"] // Allowed HTTP methods
})

// Register routes
fastify.register(enter)
fastify.register(create)
fastify.register(wsConnect)
fastify.register(ping)
fastify.register(healthz)

// Start the server
const start = async (port: number) => {
  try {
    await fastify.listen({
      port,
      host: "0.0.0.0" // Listen on all interfaces for Docker
    })
    // Initialize databases after server starts
    await initializeMessagesDB()
    await initializeNoncesDB()
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start(PORT)
