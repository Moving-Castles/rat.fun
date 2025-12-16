import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"
import { getQualifiedTableName as t, byteaToHex, ENTITY_TYPE } from "../utils.js"
import type { RatLeaderboardEntry, TripLeaderboardEntry, RatsKilledEntry } from "../types.js"

const LEADERBOARD_LIMIT = 5

const leaderboards: FastifyPluginAsync = async fastify => {
  // Active rats by total value (balance + inventory) - non-dead rats only
  fastify.get("/api/leaderboard/active-rats", async (_request, reply) => {
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
        o.value as owner,
        owner_name.value as owner_name
      FROM rat_balances rb
      LEFT JOIN ${t("Name")} n ON n.id = rb.id
      LEFT JOIN inventory_values iv ON iv.rat_id = rb.id
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
        owner: Buffer | null
        owner_name: string | null
      }>(sql, [ENTITY_TYPE.RAT, LEADERBOARD_LIMIT])

      const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
        id: byteaToHex(row.id)!,
        name: row.name,
        balance: row.balance || "0",
        inventoryValue: String(Math.floor(parseFloat(row.inventory_value || "0"))),
        totalValue: String(Math.floor(parseFloat(row.total_value || "0"))),
        dead: false,
        liquidated: false,
        liquidationValue: null,
        liquidationBlock: null,
        owner: byteaToHex(row.owner),
        ownerName: row.owner_name
      }))

      return reply.send({ entries, limit: LEADERBOARD_LIMIT })
    } catch (error) {
      console.error("Error fetching active rats leaderboard:", error)
      return reply.status(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Cashed out rats by liquidation value (dead/liquidated rats only)
  fastify.get("/api/leaderboard/cashed-out-rats", async (_request, reply) => {
    const sql = `
      SELECT
        et.id,
        n.value as name,
        lv.value as liquidation_value,
        lb.value as liquidation_block,
        o.value as owner,
        owner_name.value as owner_name
      FROM ${t("EntityType")} et
      INNER JOIN ${t("Liquidated")} l ON l.id = et.id AND l.value = true
      LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = et.id
      LEFT JOIN ${t("LiquidationBlock")} lb ON lb.id = et.id
      LEFT JOIN ${t("Name")} n ON n.id = et.id
      LEFT JOIN ${t("Owner")} o ON o.id = et.id
      LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
      WHERE et.value = $1
      ORDER BY CAST(COALESCE(lv.value, 0) AS NUMERIC) DESC
      LIMIT $2
    `

    try {
      const result = await query<{
        id: Buffer
        name: string | null
        liquidation_value: string | null
        liquidation_block: string | null
        owner: Buffer | null
        owner_name: string | null
      }>(sql, [ENTITY_TYPE.RAT, LEADERBOARD_LIMIT])

      const entries: RatLeaderboardEntry[] = result.rows.map(row => ({
        id: byteaToHex(row.id)!,
        name: row.name,
        balance: "0",
        inventoryValue: "0",
        totalValue: row.liquidation_value || "0",
        dead: true,
        liquidated: true,
        liquidationValue: row.liquidation_value,
        liquidationBlock: row.liquidation_block,
        owner: byteaToHex(row.owner),
        ownerName: row.owner_name
      }))

      return reply.send({ entries, limit: LEADERBOARD_LIMIT })
    } catch (error) {
      console.error("Error fetching cashed out rats leaderboard:", error)
      return reply.status(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Active trips by balance (liquidated and depleted trips will have balance 0)
  fastify.get("/api/leaderboard/active-trips", async (_request, reply) => {
    const sql = `
      SELECT
        et.id,
        p.value as prompt,
        COALESCE(b.value, 0) as balance,
        o.value as owner,
        owner_name.value as owner_name
      FROM ${t("EntityType")} et
      LEFT JOIN ${t("Balance")} b ON b.id = et.id
      LEFT JOIN ${t("Prompt")} p ON p.id = et.id
      LEFT JOIN ${t("Owner")} o ON o.id = et.id
      LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
      WHERE et.value = $1
      ORDER BY CAST(COALESCE(b.value, 0) AS NUMERIC) DESC
      LIMIT $2
    `

    try {
      const result = await query<{
        id: Buffer
        prompt: string | null
        balance: string
        owner: Buffer | null
        owner_name: string | null
      }>(sql, [ENTITY_TYPE.TRIP, LEADERBOARD_LIMIT])

      const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
        id: byteaToHex(row.id)!,
        prompt: row.prompt,
        balance: row.balance || "0",
        owner: byteaToHex(row.owner),
        ownerName: row.owner_name,
        liquidated: false,
        killCount: "0",
        visitCount: "0",
        tripCreationCost: "0"
      }))

      return reply.send({ entries, limit: LEADERBOARD_LIMIT })
    } catch (error) {
      console.error("Error fetching active trips leaderboard:", error)
      return reply.status(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Cashed out trips by liquidation value (liquidated trips only)
  fastify.get("/api/leaderboard/cashed-out-trips", async (_request, reply) => {
    const sql = `
      SELECT
        et.id,
        p.value as prompt,
        lv.value as liquidation_value,
        lb.value as liquidation_block,
        o.value as owner,
        owner_name.value as owner_name
      FROM ${t("EntityType")} et
      INNER JOIN ${t("Liquidated")} l ON l.id = et.id AND l.value = true
      LEFT JOIN ${t("LiquidationValue")} lv ON lv.id = et.id
      LEFT JOIN ${t("LiquidationBlock")} lb ON lb.id = et.id
      LEFT JOIN ${t("Prompt")} p ON p.id = et.id
      LEFT JOIN ${t("Owner")} o ON o.id = et.id
      LEFT JOIN ${t("Name")} owner_name ON owner_name.id = o.value
      WHERE et.value = $1
      ORDER BY CAST(COALESCE(lv.value, 0) AS NUMERIC) DESC
      LIMIT $2
    `

    try {
      const result = await query<{
        id: Buffer
        prompt: string | null
        liquidation_value: string | null
        liquidation_block: string | null
        owner: Buffer | null
        owner_name: string | null
      }>(sql, [ENTITY_TYPE.TRIP, LEADERBOARD_LIMIT])

      const entries: TripLeaderboardEntry[] = result.rows.map(row => ({
        id: byteaToHex(row.id)!,
        prompt: row.prompt,
        balance: row.liquidation_value || "0",
        owner: byteaToHex(row.owner),
        ownerName: row.owner_name,
        liquidated: true,
        killCount: "0",
        visitCount: "0",
        tripCreationCost: "0"
      }))

      return reply.send({ entries, limit: LEADERBOARD_LIMIT })
    } catch (error) {
      console.error("Error fetching cashed out trips leaderboard:", error)
      return reply.status(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Players by rats killed (pastRats array length) - kept but not shown in UI currently
  fastify.get("/api/leaderboard/rats-killed", async (_request, reply) => {
    const sql = `
      SELECT
        pr.id,
        n.value as name,
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
      }>(sql, [LEADERBOARD_LIMIT])

      const entries: RatsKilledEntry[] = result.rows.map(row => ({
        id: byteaToHex(row.id)!,
        name: row.name,
        ratsKilled: row.rats_killed || 0
      }))

      return reply.send({ entries, limit: LEADERBOARD_LIMIT })
    } catch (error) {
      console.error("Error fetching rats killed leaderboard:", error)
      return reply.status(500).send({ error: "Failed to fetch leaderboard" })
    }
  })
}

export default leaderboards
