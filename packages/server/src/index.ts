import Fastify from "fastify"
import formbody from "@fastify/formbody"
import cors from "@fastify/cors"
import compress from "@fastify/compress"

import { errorHandler } from "@modules/error-handling"
import { initializeSentry, closeSentry } from "@modules/sentry"

import enter from "@routes/trip/enter"
import create from "@routes/trip/create"
import ping from "@routes/test/ping"
import healthz from "@routes/healthz"

// Validate required environment variables
const requiredEnvVars = [
  "EVENT_MODEL",
  "EVENT_TEMPERATURE",
  "CORRECTION_MODEL",
  "CORRECTION_TEMPERATURE",
  "CHALLENGE_MODEL",
  "CHALLENGE_TEMPERATURE"
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Initialize Sentry before creating the Fastify instance
initializeSentry()

const fastify = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger"
    }
  },
  // Increase timeout for long-running requests like trip/enter
  requestTimeout: 60000, // 60 seconds (must be longer than client timeout of 45s)
  keepAliveTimeout: 5000, // 5 seconds
  bodyLimit: 1048576 // 1MB
})

// Register plugins
fastify.register(compress)
fastify.register(formbody)
fastify.register(cors, {
  origin: "*", // Allow all origins (restrict for production)
  methods: ["GET", "POST"] // Allowed HTTP methods
})

// Setup centralized error handling
fastify.setErrorHandler(errorHandler)

// Register routes
fastify.register(enter)
fastify.register(create)
fastify.register(ping)
fastify.register(healthz)

console.log("__ LOG_LEVEL", process?.env?.LOG_LEVEL ?? "1")

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)

  try {
    await closeSentry()
    await fastify.close()
    console.log("Server closed successfully")
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
