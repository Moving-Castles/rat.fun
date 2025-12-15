import z from "zod"
import { FastifyPluginAsync } from "fastify"
import { input } from "@latticexyz/store-sync/indexer-client"
import { queryLogs } from "../logs/queryLogs.js"
import { recordToLog } from "../logs/recordToLog.js"
import { getWorldAddress } from "../utils.js"

const logsRoute: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: { input: z.infer<typeof input> } }>(
    "/api/logs",
    async (request, reply) => {
      try {
        const validation = input.safeParse(typeof request.query.input === "string" ? JSON.parse(request.query.input) : {})

        if (!validation.success) {
          return reply.status(400).send({
            error: "Invalid request",
            request: request.query,
            details: validation.error.issues
          })
        }

        const { filters, address } = validation.data

        // Verify address matches world address
        const worldAddress = getWorldAddress()
        if (address?.toLowerCase() !== worldAddress.toLowerCase()) {
          return reply.status(400).send({
            error: "Address does not match world address",
            provided: address,
            expected: worldAddress
          })
        }

        // Extract playerId from filters[0].key0
        let playerId: string | undefined
        if (filters && filters.length > 0 && filters[0].key0) {
          playerId = filters[0].key0
        } else {
          return reply.status(400).send({
            error: "playerId filter is required in filters[0].key0"
          })
        }

        // Fetch hydration logs for world or specific player
        const records = await queryLogs({ playerId })

        if (records.length === 0) {
          return reply.status(404).send({
            error: "No logs found",
            address,
            playerId
          })
        }

        const blockNumber = records[0].chainBlockNumber
        const logs = records.map(recordToLog)

        // Cache headers similar to apiRoutes pattern
        const maxAgeSeconds = 60 * 5
        const staleWhileRevalidateSeconds = 4000 * 2

        reply.header(
          "Cache-Control",
          `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
        )

        return reply.send({
          blockNumber,
          totalRows: records[0].totalRows,
          logs
        })
      } catch (error) {
        console.error("Error fetching logs:", error)
        return reply.status(500).send({
          error: "Internal server error"
        })
      }
    }
  )
}

export default logsRoute