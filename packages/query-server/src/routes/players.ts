import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"
import {
  getQualifiedTableName as t,
  byteaToHex,
  getLastSyncedBlockNumber,
  ENTITY_TYPE
} from "../utils.js"
import type { PlayersEndpointResponse, OtherPlayer } from "../types.js"

// Fetch all players (minimal data: id + name only)
async function fetchAllPlayers(): Promise<OtherPlayer[]> {
  const sql = `
    SELECT et.id, n.value as name
    FROM ${t("EntityType")} et
    LEFT JOIN ${t("Name")} n ON n.id = et.id
    WHERE et.value = $1
  `

  try {
    const result = await query<{ id: Buffer; name: string | null }>(sql, [ENTITY_TYPE.PLAYER])

    return result.rows.map(row => ({
      id: byteaToHex(row.id)!,
      name: row.name
    }))
  } catch (error) {
    console.error("Error fetching players:", error)
    return []
  }
}

const players: FastifyPluginAsync = async fastify => {
  fastify.get("/api/players", async (_request, reply) => {
    const [playersList, blockNumber] = await Promise.all([
      fetchAllPlayers(),
      getLastSyncedBlockNumber()
    ])

    const response: PlayersEndpointResponse = {
      blockNumber,
      players: playersList
    }

    return reply.header("Cache-Control", "no-store").send(response)
  })
}

export default players
