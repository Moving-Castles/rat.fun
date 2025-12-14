import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"
import { formatEther } from "viem"
import { getSchemaName, NAMESPACE, byteaToHex, parsePaginationParams } from "../utils.js"
import type { RatLeaderboardEntry, TripLeaderboardEntry, RatsKilledEntry } from "../types.js"

// Entity type enum values (from contracts/enums)
const ENTITY_TYPE = {
  NONE: 0,
  PLAYER: 1,
  RAT: 2,
  TRIP: 3,
  ITEM: 4
}

// Helper to get table name
function t(tableName: string): string {
  const schema = getSchemaName()
  const snakeCase = tableName
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
  return `"${schema}"."${NAMESPACE}__${snakeCase}"`
}

const leaderboards: FastifyPluginAsync = async fastify => {
  // Active rats by total value (balance + inventory)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/rat-value/active",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      // Get all alive (not dead) rats with their balances
      // Then calculate inventory values
      const sql = `
        WITH rat_ids AS (
          SELECT et.id
          FROM ${t("EntityType")} et
          LEFT JOIN ${t("Dead")} d ON d.id = et.id
          WHERE et.value = $1 AND (d.value IS NULL OR d.value = false)
        ),
        rat_balances AS (
          SELECT r.id, COALESCE(b.value, 0) as balance
          FROM rat_ids r
          LEFT JOIN ${t("Balance")} b ON b.id = r.id
        ),
        inventory_values AS (
          SELECT inv.id as rat_id, COALESCE(SUM(CAST(v.value AS NUMERIC)), 0) as inv_value
          FROM ${t("Inventory")} inv
          CROSS JOIN LATERAL unnest(inv.value) AS item_id
          LEFT JOIN ${t("Value")} v ON v.id = item_id
          WHERE inv.id IN (SELECT id FROM rat_ids)
          GROUP BY inv.id
        )
        SELECT
          rb.id,
          n.value as name,
          rb.balance,
          COALESCE(iv.inv_value, 0) as inventory_value,
          (CAST(rb.balance AS NUMERIC) + COALESCE(iv.inv_value, 0)) as total_value,
          COALESCE(d.value, false) as dead,
          COALESCE(l.value, false) as liquidated,
          o.value as owner
        FROM rat_balances rb
        LEFT JOIN ${t("Name")} n ON n.id = rb.id
        LEFT JOIN inventory_values iv ON iv.rat_id = rb.id
        LEFT JOIN ${t("Dead")} d ON d.id = rb.id
        LEFT JOIN ${t("Liquidated")} l ON l.id = rb.id
        LEFT JOIN ${t("Owner")} o ON o.id = rb.id
        ORDER BY total_value DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          name: string | null
          balance: string
          inventory_value: string
          total_value: string
          dead: boolean
          liquidated: boolean
          owner: Buffer | null
        }>(sql, [ENTITY_TYPE.RAT, limit])

        const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: formatEther(BigInt(row.balance || "0")),
          inventoryValue: formatEther(BigInt(Math.floor(parseFloat(row.inventory_value || "0")))),
          totalValue: formatEther(BigInt(Math.floor(parseFloat(row.total_value || "0")))),
          dead: row.dead,
          liquidated: row.liquidated,
          owner: byteaToHex(row.owner)
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching active rat leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )

  // All-time rats by value (uses liquidationValue for liquidated rats)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/rat-value/all-time",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      const sql = `
        WITH rat_ids AS (
          SELECT et.id
          FROM ${t("EntityType")} et
          WHERE et.value = $1
        ),
        rat_balances AS (
          SELECT r.id, COALESCE(b.value, 0) as balance
          FROM rat_ids r
          LEFT JOIN ${t("Balance")} b ON b.id = r.id
        ),
        inventory_values AS (
          SELECT inv.id as rat_id, COALESCE(SUM(CAST(v.value AS NUMERIC)), 0) as inv_value
          FROM ${t("Inventory")} inv
          CROSS JOIN LATERAL unnest(inv.value) AS item_id
          LEFT JOIN ${t("Value")} v ON v.id = item_id
          WHERE inv.id IN (SELECT id FROM rat_ids)
          GROUP BY inv.id
        ),
        effective_values AS (
          SELECT
            rb.id,
            rb.balance,
            COALESCE(iv.inv_value, 0) as inventory_value,
            COALESCE(l.value, false) as liquidated,
            lv.value as liquidation_value,
            CASE
              WHEN COALESCE(l.value, false) = true THEN CAST(COALESCE(lv.value, 0) AS NUMERIC)
              ELSE (CAST(rb.balance AS NUMERIC) + COALESCE(iv.inv_value, 0))
            END as effective_value
          FROM rat_balances rb
          LEFT JOIN inventory_values iv ON iv.rat_id = rb.id
          LEFT JOIN ${t("Liquidated")} l ON l.id = rb.id
          LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = rb.id
        )
        SELECT
          ev.id,
          n.value as name,
          ev.balance,
          ev.inventory_value,
          ev.effective_value as total_value,
          COALESCE(d.value, false) as dead,
          ev.liquidated,
          o.value as owner
        FROM effective_values ev
        LEFT JOIN ${t("Name")} n ON n.id = ev.id
        LEFT JOIN ${t("Dead")} d ON d.id = ev.id
        LEFT JOIN ${t("Owner")} o ON o.id = ev.id
        ORDER BY ev.effective_value DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          name: string | null
          balance: string
          inventory_value: string
          total_value: string
          dead: boolean
          liquidated: boolean
          owner: Buffer | null
        }>(sql, [ENTITY_TYPE.RAT, limit])

        const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: formatEther(BigInt(row.balance || "0")),
          inventoryValue: formatEther(BigInt(Math.floor(parseFloat(row.inventory_value || "0")))),
          totalValue: formatEther(BigInt(Math.floor(parseFloat(row.total_value || "0")))),
          dead: row.dead,
          liquidated: row.liquidated,
          owner: byteaToHex(row.owner)
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching all-time rat leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )

  // Active trips by balance (balance > 0)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/trip-value/active",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      const sql = `
        SELECT
          et.id,
          n.value as name,
          b.value as balance,
          o.value as owner,
          COALESCE(l.value, false) as liquidated
        FROM ${t("EntityType")} et
        INNER JOIN ${t("Balance")} b ON b.id = et.id AND CAST(b.value AS NUMERIC) > 0
        LEFT JOIN ${t("Name")} n ON n.id = et.id
        LEFT JOIN ${t("Owner")} o ON o.id = et.id
        LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
        WHERE et.value = $1
        ORDER BY CAST(b.value AS NUMERIC) DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          name: string | null
          balance: string
          owner: Buffer | null
          liquidated: boolean
        }>(sql, [ENTITY_TYPE.TRIP, limit])

        const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: formatEther(BigInt(row.balance || "0")),
          owner: byteaToHex(row.owner),
          liquidated: row.liquidated
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching active trip leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )

  // All-time trips by value (uses liquidationValue for liquidated trips)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/trip-value/all-time",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      const sql = `
        SELECT
          et.id,
          n.value as name,
          COALESCE(b.value, 0) as balance,
          o.value as owner,
          COALESCE(l.value, false) as liquidated,
          lv.value as liquidation_value,
          CASE
            WHEN COALESCE(l.value, false) = true THEN CAST(COALESCE(lv.value, 0) AS NUMERIC)
            ELSE CAST(COALESCE(b.value, 0) AS NUMERIC)
          END as effective_value
        FROM ${t("EntityType")} et
        LEFT JOIN ${t("Balance")} b ON b.id = et.id
        LEFT JOIN ${t("Name")} n ON n.id = et.id
        LEFT JOIN ${t("Owner")} o ON o.id = et.id
        LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
        LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = et.id
        WHERE et.value = $1
        ORDER BY effective_value DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          name: string | null
          balance: string
          owner: Buffer | null
          liquidated: boolean
          liquidation_value: string | null
          effective_value: string
        }>(sql, [ENTITY_TYPE.TRIP, limit])

        const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: formatEther(BigInt(row.effective_value || "0")),
          owner: byteaToHex(row.owner),
          liquidated: row.liquidated
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching all-time trip leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )

  // Players by rats killed (pastRats array length)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/rats-killed",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      const sql = `
        SELECT
          pr.id,
          n.value as name,
          array_length(pr.value, 1) as rats_killed
        FROM ${t("PastRats")} pr
        LEFT JOIN ${t("Name")} n ON n.id = pr.id
        WHERE array_length(pr.value, 1) > 0
        ORDER BY array_length(pr.value, 1) DESC
        LIMIT $1
      `

      try {
        const result = await query<{
          id: Buffer
          name: string | null
          rats_killed: number
        }>(sql, [limit])

        const entries: RatsKilledEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          ratsKilled: row.rats_killed || 0
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching rats killed leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )
}

export default leaderboards
