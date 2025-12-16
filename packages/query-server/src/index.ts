import Fastify from "fastify"
import cors from "@fastify/cors"
import compress from "@fastify/compress"

import healthz from "./routes/healthz.js"
import rat from "./routes/rat.js"
import status from "./routes/status.js"
import player from "./routes/player.js"
import trip from "./routes/trip.js"
import item from "./routes/item.js"
import leaderboards from "./routes/leaderboards.js"
import hydration from "./routes/hydration.js"
import config from "./routes/config.js"
import worldStats from "./routes/world-stats.js"
import players from "./routes/players.js"
import trips from "./routes/trips.js"
import { closePool } from "./db.js"

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "WORLD_ADDRESS", "CHAIN_ID"] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const fastify = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger"
    }
  },
  requestTimeout: 30000,
  keepAliveTimeout: 5000,
  bodyLimit: 1048576
})

// Register plugins
fastify.register(compress)
fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST"]
})

// Register routes
fastify.register(healthz)
fastify.register(config)
fastify.register(worldStats)
fastify.register(rat)
fastify.register(player)
fastify.register(trip)
fastify.register(item)
fastify.register(leaderboards)
fastify.register(hydration)
fastify.register(players)
fastify.register(trips)
fastify.register(status)

// Root endpoint
fastify.get("/", async () => {
  return {
    service: "query-server",
    version: "1.0.0",
    worldAddress: process.env.WORLD_ADDRESS,
    chainId: process.env.CHAIN_ID
  }
})

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)

  try {
    await closePool()
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
      host: "0.0.0.0"
    })
    console.log(`Query server running on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start(Number(process.env.PORT) || 3001)
