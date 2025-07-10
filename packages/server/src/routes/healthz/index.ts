import { FastifyInstance } from "fastify"

async function routes(fastify: FastifyInstance, options: object) {
  fastify.get("/healthz", async (request, reply) => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0"
    }
  })
}

export default routes
