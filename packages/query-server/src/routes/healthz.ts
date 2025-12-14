import { FastifyPluginAsync } from "fastify"
import { getPool } from "../db.js"

const healthz: FastifyPluginAsync = async fastify => {
  fastify.get("/healthz", async (_request, reply) => {
    const version = process.env.APP_VERSION || "unknown"
    try {
      const pool = getPool()
      await pool.query("SELECT 1")
      return reply.send({ status: "ok", database: "connected", version })
    } catch (error) {
      return reply.status(503).send({
        status: "error",
        database: "disconnected",
        version,
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })
}

export default healthz
