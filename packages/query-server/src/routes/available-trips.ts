import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { query } from "../db.js"
import {
  getQualifiedTableName as t,
  getTableValue,
  byteaToHex,
  formatBalance,
  getLastSyncedBlockNumber,
  ENTITY_TYPE
} from "../utils.js"
import type { TripResponse, TripsEndpointResponse } from "../types.js"

// Query params schema for pagination
const queryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(["balance", "visitCount", "killCount", "creationBlock"]).optional().default("balance"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
})

// Fetch all trips with balance > 0
async function fetchAvailableTrips(
  limit: number,
  offset: number,
  sortBy: string,
  sortOrder: string
): Promise<{ trips: TripResponse[]; total: number }> {
  // First get total count
  const countSql = `
    SELECT COUNT(DISTINCT et.id) as count
    FROM ${t("EntityType")} et
    INNER JOIN ${t("Balance")} b ON b.id = et.id
    LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
    WHERE et.value = $1
      AND CAST(b.value AS NUMERIC) > 0
      AND (l.value IS NULL OR l.value = false)
  `

  const countResult = await query<{ count: string }>(countSql, [ENTITY_TYPE.TRIP])
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10)

  // Get paginated trip IDs with sorting
  // We need to join with the sort column to order properly
  const sortColumn = sortBy === "balance" ? "b.value" :
                     sortBy === "visitCount" ? "vc.value" :
                     sortBy === "killCount" ? "kc.value" :
                     "cb.value"

  const sql = `
    SELECT DISTINCT et.id
    FROM ${t("EntityType")} et
    INNER JOIN ${t("Balance")} b ON b.id = et.id
    LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
    LEFT JOIN ${t("VisitCount")} vc ON vc.id = et.id
    LEFT JOIN ${t("KillCount")} kc ON kc.id = et.id
    LEFT JOIN ${t("CreationBlock")} cb ON cb.id = et.id
    WHERE et.value = $1
      AND CAST(b.value AS NUMERIC) > 0
      AND (l.value IS NULL OR l.value = false)
    ORDER BY CAST(${sortColumn} AS NUMERIC) ${sortOrder === "desc" ? "DESC" : "ASC"} NULLS LAST
    LIMIT $2 OFFSET $3
  `

  try {
    const result = await query<{ id: Buffer }>(sql, [ENTITY_TYPE.TRIP, limit, offset])

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
          liquidationBlock,
          challengeTrip,
          fixedMinValueToEnter,
          overrideMaxValuePerWinPercentage,
          challengeWinnerBuffer
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
          getTableValue<string>("LiquidationBlock", tripId),
          getTableValue<boolean>("ChallengeTrip", tripId),
          getTableValue<string>("FixedMinValueToEnter", tripId),
          getTableValue<string>("OverrideMaxValuePerWinPercentage", tripId),
          getTableValue<Buffer>("ChallengeWinner", tripId)
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
          liquidationBlock,
          challengeTrip: challengeTrip ?? false,
          fixedMinValueToEnter: formatBalance(fixedMinValueToEnter),
          overrideMaxValuePerWinPercentage: overrideMaxValuePerWinPercentage ?? null,
          challengeWinner: byteaToHex(challengeWinnerBuffer)
        } as TripResponse
      })
    )

    return { trips, total }
  } catch (error) {
    console.error("Error fetching available trips:", error)
    return { trips: [], total: 0 }
  }
}

// Extended response type with pagination info
interface AvailableTripsResponse extends TripsEndpointResponse {
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

const availableTrips: FastifyPluginAsync = async fastify => {
  fastify.get<{
    Querystring: { limit?: string; offset?: string; sortBy?: string; sortOrder?: string }
  }>("/api/trips/available", async (request, reply) => {
    const validation = queryParamsSchema.safeParse(request.query)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { limit, offset, sortBy, sortOrder } = validation.data

    const [{ trips, total }, blockNumber] = await Promise.all([
      fetchAvailableTrips(limit, offset, sortBy, sortOrder),
      getLastSyncedBlockNumber()
    ])

    const response: AvailableTripsResponse = {
      blockNumber,
      trips,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + trips.length < total
      }
    }

    return reply.header("Cache-Control", "no-store").send(response)
  })
}

export default availableTrips
