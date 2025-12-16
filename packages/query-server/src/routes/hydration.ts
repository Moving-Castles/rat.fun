import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import {
  getTableValue,
  getArrayValue,
  byteaToHex,
  formatBalance,
  getLastSyncedBlockNumber
} from "../utils.js"
import type { PlayerResponse, ItemResponse, RatResponse, HydrationResponse } from "../types.js"

// Request schema
const hydrationSchema = z.object({
  playerId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Fetch player data
async function fetchPlayer(playerId: string): Promise<PlayerResponse | null> {
  const [name, currentRatBuffer, pastRats, creationBlock, masterKey] = await Promise.all([
    getTableValue<string>("Name", playerId),
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
    currentRat: byteaToHex(currentRatBuffer),
    pastRats,
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
    inventoryIds,
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
  const inventory = await Promise.all(inventoryIds.map(itemId => fetchItem(itemId)))

  // Calculate total value (balance + sum of inventory values)
  const formattedBalance = formatBalance(balance)
  let totalValue = formattedBalance
  try {
    let total = formattedBalance ? BigInt(formattedBalance) : 0n
    for (const item of inventory) {
      if (item.value) {
        total += BigInt(item.value)
      }
    }
    totalValue = total.toString()
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
    tripCount: tripCount ?? "0",
    liquidated: liquidated ?? false,
    liquidationValue: formatBalance(liquidationValue),
    liquidationBlock,
    totalValue
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
        getLastSyncedBlockNumber()
      ])

      if (!player) {
        return reply.status(404).send({
          error: "Player not found",
          id: playerId
        })
      }

      // Fetch current rat if player has one
      const currentRat = player.currentRat ? await fetchRat(player.currentRat) : null

      // Items are part of the rat's inventory
      const items: ItemResponse[] = currentRat?.inventory ?? []

      const response: HydrationResponse = {
        blockNumber,
        player,
        currentRat,
        items
      }

      return reply.header("Cache-Control", "no-store, no-cache, must-revalidate").send(response)
    }
  )
}

export default hydration
