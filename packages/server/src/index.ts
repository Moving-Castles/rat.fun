import Fastify from "fastify"
import formbody from "@fastify/formbody"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"

import { PORT } from "@config"

import enter from "@routes/room/enter"
import create from "@routes/room/create"
import wsConnect from "@routes/ws-connect"
import ping from "@routes/test/ping"
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
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start(PORT)
