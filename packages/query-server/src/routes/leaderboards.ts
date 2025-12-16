import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"
import {
  getQualifiedTableName as t,
  byteaToHex,
  parsePaginationParams,
  ENTITY_TYPE
} from "../utils.js"
import type { RatLeaderboardEntry, TripLeaderboardEntry, RatsKilledEntry } from "../types.js"

const leaderboards: FastifyPluginAsync = async fastify => {
  // Active rats by total value (balance + inventory)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/rat-value/active",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      // Get all alive (not dead) rats with their balances
      // MUD stores Inventory as JSON TEXT (SuperJSON format), so we use jsonb functions
      // Using LATERAL join to avoid set-returning function in CASE error
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
        inventory_json AS (
          SELECT
            inv.id as rat_id,
            -- Extract the array from SuperJSON format or use as-is
            CASE
              WHEN inv.value::jsonb ? 'json' THEN (inv.value::jsonb)->'json'
              ELSE inv.value::jsonb
            END as items_array
          FROM ${t("Inventory")} inv
          WHERE inv.id IN (SELECT id FROM rat_ids)
            AND inv.value IS NOT NULL
            AND inv.value != ''
            AND inv.value != '[]'
            AND inv.value != '{"json":[],"meta":{}}'
        ),
        inventory_items AS (
          SELECT ij.rat_id, item_hex.value as item_id_hex
          FROM inventory_json ij
          CROSS JOIN LATERAL jsonb_array_elements_text(ij.items_array) as item_hex(value)
        ),
        inventory_values AS (
          SELECT
            ii.rat_id,
            COALESCE(SUM(CAST(v.value AS NUMERIC)), 0) as inv_value
          FROM inventory_items ii
          LEFT JOIN ${t("Value")} v ON v.id = decode(substring(ii.item_id_hex from 3), 'hex')
          WHERE ii.item_id_hex IS NOT NULL AND ii.item_id_hex != '' AND ii.item_id_hex != '0x'
          GROUP BY ii.rat_id
        )
        SELECT
          rb.id,
          n.value as name,
          rb.balance,
          COALESCE(iv.inv_value, 0) as inventory_value,
          (CAST(rb.balance AS NUMERIC) + COALESCE(iv.inv_value, 0)) as total_value,
          COALESCE(d.value, false) as dead,
          COALESCE(l.value, false) as liquidated,
          lv.value as liquidation_value,
          lb.value as liquidation_block,
          o.value as owner,
          owner_name.value as owner_name
        FROM rat_balances rb
        LEFT JOIN ${t("Name")} n ON n.id = rb.id
        LEFT JOIN inventory_values iv ON iv.rat_id = rb.id
        LEFT JOIN ${t("Dead")} d ON d.id = rb.id
        LEFT JOIN ${t("Liquidated")} l ON l.id = rb.id
        LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = rb.id
        LEFT JOIN ${t("LiquidationBlock")} lb ON lb.id = rb.id
        LEFT JOIN ${t("Owner")} o ON o.id = rb.id
        LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
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
          liquidation_value: string | null
          liquidation_block: string | null
          owner: Buffer | null
          owner_name: string | null
        }>(sql, [ENTITY_TYPE.RAT, limit])

        const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: row.balance || "0",
          inventoryValue: String(Math.floor(parseFloat(row.inventory_value || "0"))),
          totalValue: String(Math.floor(parseFloat(row.total_value || "0"))),
          dead: row.dead,
          liquidated: row.liquidated,
          liquidationValue: row.liquidation_value,
          liquidationBlock: row.liquidation_block,
          owner: byteaToHex(row.owner),
          ownerName: row.owner_name
        }))

        return reply.send({ entries, limit })
      } catch (error) {
        console.error("Error fetching active rat leaderboard:", error)
        return reply.status(500).send({ error: "Failed to fetch leaderboard" })
      }
    }
  )

  // All-time rats by value (uses liquidationValue for dead rats)
  fastify.get<{ Querystring: { limit?: string } }>(
    "/api/leaderboard/rat-value/all-time",
    async (request, reply) => {
      const limit = parsePaginationParams(request.query.limit)

      // MUD stores Inventory as JSON TEXT (SuperJSON format), so we use jsonb functions
      // Using LATERAL join to avoid set-returning function in CASE error
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
        inventory_json AS (
          SELECT
            inv.id as rat_id,
            -- Extract the array from SuperJSON format or use as-is
            CASE
              WHEN inv.value::jsonb ? 'json' THEN (inv.value::jsonb)->'json'
              ELSE inv.value::jsonb
            END as items_array
          FROM ${t("Inventory")} inv
          WHERE inv.id IN (SELECT id FROM rat_ids)
            AND inv.value IS NOT NULL
            AND inv.value != ''
            AND inv.value != '[]'
            AND inv.value != '{"json":[],"meta":{}}'
        ),
        inventory_items AS (
          SELECT ij.rat_id, item_hex.value as item_id_hex
          FROM inventory_json ij
          CROSS JOIN LATERAL jsonb_array_elements_text(ij.items_array) as item_hex(value)
        ),
        inventory_values AS (
          SELECT
            ii.rat_id,
            COALESCE(SUM(CAST(v.value AS NUMERIC)), 0) as inv_value
          FROM inventory_items ii
          LEFT JOIN ${t("Value")} v ON v.id = decode(substring(ii.item_id_hex from 3), 'hex')
          WHERE ii.item_id_hex IS NOT NULL AND ii.item_id_hex != '' AND ii.item_id_hex != '0x'
          GROUP BY ii.rat_id
        ),
        effective_values AS (
          SELECT
            rb.id,
            rb.balance,
            COALESCE(iv.inv_value, 0) as inventory_value,
            COALESCE(d.value, false) as dead,
            COALESCE(l.value, false) as liquidated,
            lv.value as liquidation_value,
            lb.value as liquidation_block,
            CASE
              WHEN COALESCE(d.value, false) = true THEN CAST(COALESCE(lv.value, 0) AS NUMERIC)
              ELSE (CAST(rb.balance AS NUMERIC) + COALESCE(iv.inv_value, 0))
            END as effective_value
          FROM rat_balances rb
          LEFT JOIN inventory_values iv ON iv.rat_id = rb.id
          LEFT JOIN ${t("Dead")} d ON d.id = rb.id
          LEFT JOIN ${t("Liquidated")} l ON l.id = rb.id
          LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = rb.id
          LEFT JOIN ${t("LiquidationBlock")} lb ON lb.id = rb.id
        )
        SELECT
          ev.id,
          n.value as name,
          ev.balance,
          ev.inventory_value,
          ev.effective_value as total_value,
          ev.dead,
          ev.liquidated,
          ev.liquidation_value,
          ev.liquidation_block,
          o.value as owner,
          owner_name.value as owner_name
        FROM effective_values ev
        LEFT JOIN ${t("Name")} n ON n.id = ev.id
        LEFT JOIN ${t("Owner")} o ON o.id = ev.id
        LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
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
          liquidation_value: string | null
          liquidation_block: string | null
          owner: Buffer | null
          owner_name: string | null
        }>(sql, [ENTITY_TYPE.RAT, limit])

        const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          name: row.name,
          balance: row.balance || "0",
          inventoryValue: String(Math.floor(parseFloat(row.inventory_value || "0"))),
          totalValue: String(Math.floor(parseFloat(row.total_value || "0"))),
          dead: row.dead,
          liquidated: row.liquidated,
          liquidationValue: row.liquidation_value,
          liquidationBlock: row.liquidation_block,
          owner: byteaToHex(row.owner),
          ownerName: row.owner_name
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
          p.value as prompt,
          b.value as balance,
          o.value as owner,
          owner_name.value as owner_name,
          COALESCE(l.value, false) as liquidated,
          COALESCE(kc.value, 0) as kill_count,
          COALESCE(vc.value, 0) as visit_count,
          COALESCE(tcc.value, 0) as trip_creation_cost
        FROM ${t("EntityType")} et
        INNER JOIN ${t("Balance")} b ON b.id = et.id AND CAST(b.value AS NUMERIC) > 0
        LEFT JOIN ${t("Prompt")} p ON p.id = et.id
        LEFT JOIN ${t("Owner")} o ON o.id = et.id
        LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
        LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
        LEFT JOIN ${t("KillCount")} kc ON kc.id = et.id
        LEFT JOIN ${t("VisitCount")} vc ON vc.id = et.id
        LEFT JOIN ${t("TripCreationCost")} tcc ON tcc.id = et.id
        WHERE et.value = $1
        ORDER BY CAST(b.value AS NUMERIC) DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          prompt: string | null
          balance: string
          owner: Buffer | null
          owner_name: string | null
          liquidated: boolean
          kill_count: string
          visit_count: string
          trip_creation_cost: string
        }>(sql, [ENTITY_TYPE.TRIP, limit])

        const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          prompt: row.prompt,
          balance: row.balance || "0",
          owner: byteaToHex(row.owner),
          ownerName: row.owner_name,
          liquidated: row.liquidated,
          killCount: row.kill_count || "0",
          visitCount: row.visit_count || "0",
          tripCreationCost: row.trip_creation_cost || "0"
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
          p.value as prompt,
          COALESCE(b.value, 0) as balance,
          o.value as owner,
          owner_name.value as owner_name,
          COALESCE(l.value, false) as liquidated,
          lv.value as liquidation_value,
          COALESCE(kc.value, 0) as kill_count,
          COALESCE(vc.value, 0) as visit_count,
          COALESCE(tcc.value, 0) as trip_creation_cost,
          CASE
            WHEN COALESCE(l.value, false) = true THEN CAST(COALESCE(lv.value, 0) AS NUMERIC)
            ELSE CAST(COALESCE(b.value, 0) AS NUMERIC)
          END as effective_value
        FROM ${t("EntityType")} et
        LEFT JOIN ${t("Balance")} b ON b.id = et.id
        LEFT JOIN ${t("Prompt")} p ON p.id = et.id
        LEFT JOIN ${t("Owner")} o ON o.id = et.id
        LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
        LEFT JOIN ${t("Liquidated")} l ON l.id = et.id
        LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = et.id
        LEFT JOIN ${t("KillCount")} kc ON kc.id = et.id
        LEFT JOIN ${t("VisitCount")} vc ON vc.id = et.id
        LEFT JOIN ${t("TripCreationCost")} tcc ON tcc.id = et.id
        WHERE et.value = $1
        ORDER BY effective_value DESC
        LIMIT $2
      `

      try {
        const result = await query<{
          id: Buffer
          prompt: string | null
          balance: string
          owner: Buffer | null
          owner_name: string | null
          liquidated: boolean
          liquidation_value: string | null
          kill_count: string
          visit_count: string
          trip_creation_cost: string
          effective_value: string
        }>(sql, [ENTITY_TYPE.TRIP, limit])

        const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
          id: byteaToHex(row.id)!,
          prompt: row.prompt,
          balance: String(Math.floor(parseFloat(row.effective_value || "0"))),
          owner: byteaToHex(row.owner),
          ownerName: row.owner_name,
          liquidated: row.liquidated,
          killCount: row.kill_count || "0",
          visitCount: row.visit_count || "0",
          tripCreationCost: row.trip_creation_cost || "0"
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

      // MUD stores PastRats as JSON TEXT (SuperJSON format), so we use jsonb functions
      const sql = `
        SELECT
          pr.id,
          n.value as name,
          -- Get array length from SuperJSON: {"json":[...],"meta":{}} or plain array
          CASE
            WHEN pr.value::jsonb ? 'json' THEN jsonb_array_length((pr.value::jsonb)->'json')
            ELSE jsonb_array_length(pr.value::jsonb)
          END as rats_killed
        FROM ${t("PastRats")} pr
        LEFT JOIN ${t("Name")} n ON n.id = pr.id
        WHERE pr.value IS NOT NULL
          AND pr.value != ''
          AND pr.value != '[]'
          AND pr.value != '{"json":[],"meta":{}}'
        ORDER BY
          CASE
            WHEN pr.value::jsonb ? 'json' THEN jsonb_array_length((pr.value::jsonb)->'json')
            ELSE jsonb_array_length(pr.value::jsonb)
          END DESC
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
