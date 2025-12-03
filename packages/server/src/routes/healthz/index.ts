import { FastifyInstance } from "fastify"
import { createStore } from "@modules/redis"
import { getLatestBlockNumber } from "@modules/mud/getOnchainData"
import { network } from "@modules/mud/initMud"
import { getNetworkConfig } from "@modules/mud/getNetworkConfig"

async function routes(fastify: FastifyInstance, options: object) {
  fastify.get("/healthz", async (request, reply) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      app_version: process.env.APP_VERSION || "unknown",
      llm: {
        event: {
          model: process.env.EVENT_MODEL || "unknown",
          temperature: process.env.EVENT_TEMPERATURE ? Number(process.env.EVENT_TEMPERATURE) : null
        },
        correction: {
          model: process.env.CORRECTION_MODEL || "unknown",
          temperature: process.env.CORRECTION_TEMPERATURE
            ? Number(process.env.CORRECTION_TEMPERATURE)
            : null
        }
      },
      services: {
        redis: { status: "unknown" as string, error: null as string | null },
        blockchain: {
          status: "unknown" as string,
          world_address: network?.worldContract?.address ?? "unknown",
          latestBlock: null as number | null,
          rpc_url: null as string | null,
          error: null as string | null
        }
      }
    }

    // Check Redis connection
    try {
      const store = createStore()
      if (process.env.REDIS_URL) {
        // Only test Redis if REDIS_URL is configured
        // Test with a health check nonce
        const testNonce = Date.now()
        await store.storeNonce(testNonce)
        await store.hasNonce(testNonce)
        health.services.redis.status = "healthy"
      } else {
        health.services.redis.status = "not-configured"
      }
    } catch (error) {
      health.services.redis.status = "unhealthy"
      health.services.redis.error = error instanceof Error ? error.message : String(error)
    }

    // Get RPC URL for blockchain service
    try {
      const chainId = Number(process.env.CHAIN_ID)
      if (chainId) {
        const networkConfig = await getNetworkConfig(chainId)
        const rpcUrl = networkConfig.chain.rpcUrls.default.http[0]
        health.services.blockchain.rpc_url = rpcUrl
      }
    } catch (error) {
      // If we can't get the RPC URL, we'll leave it as null
      // This shouldn't affect the overall health status
    }

    // Check blockchain connection
    try {
      // Use a shorter timeout for the blockchain check to prevent hanging
      const latestBlock = await Promise.race([
        getLatestBlockNumber(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Blockchain check timeout")), 5000)
        )
      ])

      if (latestBlock === BigInt(0)) {
        // If we get 0, it likely means the blockchain is down or unreachable
        health.services.blockchain.status = "unhealthy"
        health.services.blockchain.error = "Blockchain unreachable or timeout occurred"
      } else {
        health.services.blockchain.status = "healthy"
        health.services.blockchain.latestBlock = Number(latestBlock)
      }
    } catch (error) {
      health.services.blockchain.status = "unhealthy"
      health.services.blockchain.error = error instanceof Error ? error.message : String(error)
    }

    // Determine overall status - unhealthy if either service is unhealthy
    if (
      health.services.redis.status === "unhealthy" ||
      health.services.blockchain.status === "unhealthy"
    ) {
      health.status = "unhealthy"
      return reply.status(503).send(health)
    }

    return reply.status(200).send(health)
  })
}

export default routes
