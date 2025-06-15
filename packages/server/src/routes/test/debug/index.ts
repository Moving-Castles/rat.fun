import { FastifyInstance } from "fastify"

async function routes (fastify: FastifyInstance, options: object) {
    fastify.get('/test/debug', async (request, reply) => {
        throw new Error("Test error");
    })
}

export default routes;