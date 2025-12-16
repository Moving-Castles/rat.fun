import { FastifyPluginAsync } from "fastify"
import { getSingletonTableRow, getLastSyncedBlockNumber } from "../utils.js"
import type { WorldStatsEndpointResponse } from "../types.js"

// Raw DB row type (columns are snake_case)
type WorldStatsRow = {
  global_trip_index: string | null
  global_rat_index: string | null
  global_rat_kill_count: string | null
  last_killed_rat_block: string | null
}

const worldStats: FastifyPluginAsync = async fastify => {
  fastify.get("/api/world-stats", async (_request, reply) => {
    const [worldStatsRow, blockNumber] = await Promise.all([
      getSingletonTableRow<WorldStatsRow>("WorldStats"),
      getLastSyncedBlockNumber()
    ])

    const response: WorldStatsEndpointResponse = {
      blockNumber,
      globalTripIndex: worldStatsRow?.global_trip_index ?? null,
      globalRatIndex: worldStatsRow?.global_rat_index ?? null,
      globalRatKillCount: worldStatsRow?.global_rat_kill_count ?? null,
      lastKilledRatBlock: worldStatsRow?.last_killed_rat_block ?? null
    }

    return reply.header("Cache-Control", "no-store").send(response)
  })
}

export default worldStats
