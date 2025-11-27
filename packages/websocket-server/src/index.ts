import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import compress from "@fastify/compress"

import { errorHandler } from "@modules/error-handling"

import wsConnect from "@routes/ws-connect"

const fastify = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger"
    }
  },
  keepAliveTimeout: 5000,
  bodyLimit: 1048576 // 1MB
})

// Register plugins
// Note: Fastify 5 has a TypeProvider variance issue where plugin types don't align
// with the inferred FastifyInstance type. Runtime behavior is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fastify.register(websocket as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fastify.register(compress as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fastify.register(cors as any, {
  origin: "*", // Allow all origins (restrict for production)
  methods: ["GET", "POST"]
})

// Setup centralized error handling
fastify.setErrorHandler(errorHandler)

// Register routes
fastify.register(wsConnect)

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)

  try {
    await fastify.close()
    console.log("WebSocket server closed successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

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

start(Number(process.env.PORT))
