import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { getTableValue, byteaToHex, formatBalance } from "../utils.js"

// Request schema
const getTripSchema = z.object({
  id: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Response type
interface TripInfo {
  id: string
  name: string | null
  owner: string | null
  index: string | null
  balance: string | null
  prompt: string | null
  visitCount: string | null
  killCount: string | null
  creationBlock: string | null
  lastVisitBlock: string | null
  tripCreationCost: string | null
  liquidated: boolean
  liquidationValue: string | null
  liquidationBlock: string | null
}

const trip: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { id: string } }>("/api/trip/:id", async (request, reply) => {
    const validation = getTripSchema.safeParse(request.params)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { id } = validation.data

    // Query all trip-related data in parallel
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
      getTableValue<string>("Name", id),
      getTableValue<Buffer>("Owner", id),
      getTableValue<string>("Index", id),
      getTableValue<string>("Balance", id),
      getTableValue<string>("Prompt", id),
      getTableValue<string>("VisitCount", id),
      getTableValue<string>("KillCount", id),
      getTableValue<string>("CreationBlock", id),
      getTableValue<string>("LastVisitBlock", id),
      getTableValue<string>("TripCreationCost", id),
      getTableValue<boolean>("Liquidated", id),
      getTableValue<string>("LiquidationValue", id),
      getTableValue<string>("LiquidationBlock", id)
    ])

    // Check if this entity exists (has at least a name or creationBlock)
    if (!name && !creationBlock) {
      return reply.status(404).send({
        error: "Trip not found",
        id
      })
    }

    // Convert owner buffer to hex string
    const owner = byteaToHex(ownerBuffer)

    const tripInfo: TripInfo = {
      id,
      name,
      owner,
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
    }

    return reply.send(tripInfo)
  })
}

export default trip
