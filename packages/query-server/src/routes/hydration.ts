import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { query } from "../db.js"
import { formatEther } from "viem"
import {
  getSchemaName,
  NAMESPACE,
  getTableValue,
  getArrayValue,
  hexToByteaParam,
  byteaToHex,
  formatBalance
} from "../utils.js"
import type {
  PlayerResponse,
  ItemResponse,
  RatResponse,
  TripResponse,
  OtherPlayer,
  HydrationResponse
} from "../types.js"

// Entity type enum values (from contracts/enums)
const ENTITY_TYPE = {
  NONE: 0,
  PLAYER: 1,
  RAT: 2,
  TRIP: 3,
  ITEM: 4
}

// Request schema
const hydrationSchema = z.object({
  playerId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Get the current synced block number from the indexer
async function getCurrentBlockNumber(): Promise<string> {
  const schema = getSchemaName()
  // Query the MUD internal table that tracks the last synced block
  const sql = `SELECT MAX("__lastUpdatedBlockNumber") as block FROM "${schema}"."__mudStoreTables"`

  try {
    const result = await query<{ block: string | null }>(sql, [])
    return result.rows[0]?.block || "0"
  } catch (error) {
    console.error("Error fetching current block number:", error)
    return "0"
  }
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

// Fetch player data
async function fetchPlayer(playerId: string): Promise<PlayerResponse | null> {
  const [name, balance, currentRatBuffer, pastRatsBuffers, creationBlock, masterKey] =
    await Promise.all([
      getTableValue<string>("Name", playerId),
      getTableValue<string>("Balance", playerId),
      getTableValue<Buffer>("CurrentRat", playerId),
      getArrayValue("PastRats", playerId),
      getTableValue<string>("CreationBlock", playerId),
      getTableValue<boolean>("MasterKey", playerId)
    ])

  if (!name && !creationBlock) {
    return null
  }

  return {
    id: playerId,
    name,
    balance: formatBalance(balance),
    currentRat: byteaToHex(currentRatBuffer),
    pastRats: pastRatsBuffers.map(b => byteaToHex(b)!).filter(Boolean),
    creationBlock,
    masterKey: masterKey ?? false
  }
}

// Fetch item details
async function fetchItem(itemId: string): Promise<ItemResponse> {
  const [name, value] = await Promise.all([
    getTableValue<string>("Name", itemId),
    getTableValue<string>("Value", itemId)
  ])

  return {
    id: itemId,
    name,
    value: formatBalance(value)
  }
}

// Fetch rat data with inventory
async function fetchRat(ratId: string): Promise<RatResponse | null> {
  const [
    name,
    index,
    balance,
    ownerBuffer,
    dead,
    inventoryBuffers,
    creationBlock,
    tripCount,
    liquidated,
    liquidationValue,
    liquidationBlock
  ] = await Promise.all([
    getTableValue<string>("Name", ratId),
    getTableValue<string>("Index", ratId),
    getTableValue<string>("Balance", ratId),
    getTableValue<Buffer>("Owner", ratId),
    getTableValue<boolean>("Dead", ratId),
    getArrayValue("Inventory", ratId),
    getTableValue<string>("CreationBlock", ratId),
    getTableValue<string>("TripCount", ratId),
    getTableValue<boolean>("Liquidated", ratId),
    getTableValue<string>("LiquidationValue", ratId),
    getTableValue<string>("LiquidationBlock", ratId)
  ])

  if (!name && !creationBlock) {
    return null
  }

  // Fetch inventory items
  const inventory = await Promise.all(inventoryBuffers.map(b => fetchItem(byteaToHex(b)!)))

  // Calculate total value
  const formattedBalance = formatBalance(balance)
  let totalValue = formattedBalance
  try {
    let total = formattedBalance ? BigInt(Math.floor(parseFloat(formattedBalance) * 1e18)) : 0n
    for (const item of inventory) {
      if (item.value) {
        total += BigInt(Math.floor(parseFloat(item.value) * 1e18))
      }
    }
    totalValue = formatEther(total)
  } catch {
    // Keep formattedBalance as totalValue
  }

  return {
    id: ratId,
    name,
    index,
    balance: formattedBalance,
    owner: byteaToHex(ownerBuffer),
    dead: dead ?? false,
    inventory,
    creationBlock,
    tripCount,
    liquidated: liquidated ?? false,
    liquidationValue: formatBalance(liquidationValue),
    liquidationBlock,
    totalValue
  }
}

// Fetch trips for player (balance > 0 OR owned by player)
async function fetchTrips(playerId: string): Promise<TripResponse[]> {
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
          name,
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
          getTableValue<string>("Name", tripId),
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
          name,
          owner: byteaToHex(ownerBuffer),
          index,
          balance: formatBalance(balance),
          prompt,
          visitCount,
          killCount,
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

// Fetch other players (minimal data: id + name only)
async function fetchOtherPlayers(excludePlayerId: string): Promise<OtherPlayer[]> {
  const sql = `
    SELECT et.id, n.value as name
    FROM ${t("EntityType")} et
    LEFT JOIN ${t("Name")} n ON n.id = et.id
    WHERE et.value = $1 AND et.id != $2
  `

  try {
    const result = await query<{ id: Buffer; name: string | null }>(sql, [
      ENTITY_TYPE.PLAYER,
      hexToByteaParam(excludePlayerId)
    ])

    return result.rows.map(row => ({
      id: byteaToHex(row.id)!,
      name: row.name
    }))
  } catch (error) {
    console.error("Error fetching other players:", error)
    return []
  }
}

const hydration: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { playerId: string } }>(
    "/api/hydration/:playerId",
    async (request, reply) => {
      const validation = hydrationSchema.safeParse(request.params)
      if (!validation.success) {
        return reply.status(400).send({
          error: "Invalid request",
          details: validation.error.issues
        })
      }

      const { playerId } = validation.data

      // Fetch player and block number in parallel
      const [player, blockNumber] = await Promise.all([
        fetchPlayer(playerId),
        getCurrentBlockNumber()
      ])

      if (!player) {
        return reply.status(404).send({
          error: "Player not found",
          id: playerId
        })
      }

      // Fetch related data in parallel
      const [currentRat, trips, otherPlayers] = await Promise.all([
        player.currentRat ? fetchRat(player.currentRat) : Promise.resolve(null),
        fetchTrips(playerId),
        fetchOtherPlayers(playerId)
      ])

      // Items are part of the rat's inventory
      const items: ItemResponse[] = currentRat?.inventory ?? []

      const response: HydrationResponse = {
        blockNumber,
        player,
        currentRat,
        trips,
        items,
        otherPlayers
      }

      return reply.send(response)
    }
  )
}

export default hydration
