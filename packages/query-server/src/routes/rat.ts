import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { formatEther } from "viem"
import { getTableValue, getArrayValue, byteaToHex, formatBalance } from "../utils.js"
import type { ItemResponse, RatResponse } from "../types.js"

// Request schema
const getRatSchema = z.object({
  id: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Fetch item details for a list of item IDs
async function fetchInventoryItems(itemIds: Buffer[]): Promise<ItemResponse[]> {
  if (itemIds.length === 0) return []

  const items = await Promise.all(
    itemIds.map(async itemBuffer => {
      const itemId = byteaToHex(itemBuffer)!
      const [name, value] = await Promise.all([
        getTableValue<string>("Name", itemId),
        getTableValue<string>("Value", itemId)
      ])
      return {
        id: itemId,
        name,
        value: formatBalance(value)
      }
    })
  )

  return items
}

// Calculate total value (balance + sum of inventory values)
function calculateTotalValue(balance: string | null, inventory: ItemResponse[]): string | null {
  try {
    let total = balance ? BigInt(Math.floor(parseFloat(balance) * 1e18)) : 0n

    for (const item of inventory) {
      if (item.value) {
        total += BigInt(Math.floor(parseFloat(item.value) * 1e18))
      }
    }

    return formatEther(total)
  } catch {
    return balance
  }
}

const rat: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { id: string } }>("/api/rat/:id", async (request, reply) => {
    const validation = getRatSchema.safeParse(request.params)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { id } = validation.data

    // Query all rat-related data in parallel
    const [
      name,
      balance,
      dead,
      liquidated,
      liquidationValue,
      liquidationBlock,
      ownerBuffer,
      index,
      tripCount,
      creationBlock,
      inventoryBuffers
    ] = await Promise.all([
      getTableValue<string>("Name", id),
      getTableValue<string>("Balance", id),
      getTableValue<boolean>("Dead", id),
      getTableValue<boolean>("Liquidated", id),
      getTableValue<string>("LiquidationValue", id),
      getTableValue<string>("LiquidationBlock", id),
      getTableValue<Buffer>("Owner", id),
      getTableValue<string>("Index", id),
      getTableValue<string>("TripCount", id),
      getTableValue<string>("CreationBlock", id),
      getArrayValue("Inventory", id)
    ])

    // Check if this entity exists (has at least a name or creationBlock)
    if (!name && !creationBlock) {
      return reply.status(404).send({
        error: "Rat not found",
        id
      })
    }

    // Convert owner buffer to hex string
    const owner = byteaToHex(ownerBuffer)

    // Fetch expanded inventory items
    const inventory = await fetchInventoryItems(inventoryBuffers)

    // Format balance
    const formattedBalance = formatBalance(balance)

    // Calculate total value
    const totalValue = calculateTotalValue(formattedBalance, inventory)

    const ratInfo: RatResponse = {
      id,
      name,
      index,
      balance: formattedBalance,
      owner,
      dead: dead ?? false,
      inventory,
      creationBlock,
      tripCount,
      liquidated: liquidated ?? false,
      liquidationValue: formatBalance(liquidationValue),
      liquidationBlock,
      totalValue
    }

    return reply.send(ratInfo)
  })
}

export default rat
