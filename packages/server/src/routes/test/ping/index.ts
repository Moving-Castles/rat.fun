import { FastifyInstance } from "fastify"

async function routes(fastify: FastifyInstance, _options: object) {
  fastify.get("/test/ping", async (_request, _reply) => {
    return { message: "pong" }
  })
}

export default routes
