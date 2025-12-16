import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { query } from "../db.js"
import {
  getQualifiedTableName as t,
  getTableValue,
  hexToByteaParam,
  byteaToHex,
  formatBalance,
  getLastSyncedBlockNumber,
  ENTITY_TYPE
} from "../utils.js"
import type { TripResponse, TripsEndpointResponse } from "../types.js"

// Request schema
const tripsSchema = z.object({
  playerId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Fetch trips for player (balance > 0 OR owned by player)
async function fetchTripsForPlayer(playerId: string): Promise<TripResponse[]> {
  const sql = `
    SELECT DISTINCT et.id
    FROM ${t("EntityType")} et
    LEFT JOIN ${t("Balance")} b ON b.id = et.id
    LEFT JOIN ${t("Owner")} o ON o.id = et.id
    WHERE et.value = $1
      AND (
        (b.value IS NOT NULL AND CAST(b.value AS NUMERIC) > 0)
        OR o.value = $2
      )
  `

  try {
    const result = await query<{ id: Buffer }>(sql, [ENTITY_TYPE.TRIP, hexToByteaParam(playerId)])

    const trips = await Promise.all(
      result.rows.map(async row => {
        const tripId = byteaToHex(row.id)!
        const [
          ownerBuffer,
          index,
          balance,
          prompt,
          visitCount,
          killCount,
          creationBlock,
          lastVisitBlock,
          tripCreationCost,
          liquidated,
          liquidationValue,
          liquidationBlock
        ] = await Promise.all([
          getTableValue<Buffer>("Owner", tripId),
          getTableValue<string>("Index", tripId),
          getTableValue<string>("Balance", tripId),
          getTableValue<string>("Prompt", tripId),
          getTableValue<string>("VisitCount", tripId),
          getTableValue<string>("KillCount", tripId),
          getTableValue<string>("CreationBlock", tripId),
          getTableValue<string>("LastVisitBlock", tripId),
          getTableValue<string>("TripCreationCost", tripId),
          getTableValue<boolean>("Liquidated", tripId),
          getTableValue<string>("LiquidationValue", tripId),
          getTableValue<string>("LiquidationBlock", tripId)
        ])

        return {
          id: tripId,
          owner: byteaToHex(ownerBuffer),
          index,
          balance: formatBalance(balance),
          prompt,
          visitCount: visitCount ?? "0",
          killCount: killCount ?? "0",
          creationBlock,
          lastVisitBlock,
          tripCreationCost: formatBalance(tripCreationCost),
          liquidated: liquidated ?? false,
          liquidationValue: formatBalance(liquidationValue),
          liquidationBlock
        } as TripResponse
      })
    )

    return trips
  } catch (error) {
    console.error("Error fetching trips:", error)
    return []
  }
}

const trips: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { playerId: string } }>("/api/trips/:playerId", async (request, reply) => {
    const validation = tripsSchema.safeParse(request.params)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { playerId } = validation.data

    const [tripsList, blockNumber] = await Promise.all([
      fetchTripsForPlayer(playerId),
      getLastSyncedBlockNumber()
    ])

    const response: TripsEndpointResponse = {
      blockNumber,
      trips: tripsList
    }

    return reply.header("Cache-Control", "no-store").send(response)
  })
}

export default trips
