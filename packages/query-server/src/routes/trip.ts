import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { getTableValue, byteaToHex, formatBalance, ENTITY_TYPE } from "../utils.js"

// Request schema
const getTripSchema = z.object({
  id: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Response type
interface TripInfo {
  id: string
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
  // Challenge trip fields
  challengeTrip: boolean
  fixedMinValueToEnter: string | null
  overrideMaxValuePerWinPercentage: string | null
  challengeWinner: string | null
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
      entityType,
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
      // Challenge trip fields
      challengeTrip,
      fixedMinValueToEnter,
      overrideMaxValuePerWinPercentage,
      challengeWinnerBuffer
    ] = await Promise.all([
      getTableValue<number>("EntityType", id),
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
      getTableValue<string>("LiquidationBlock", id),
      // Challenge trip fields
      getTableValue<boolean>("ChallengeTrip", id),
      getTableValue<string>("FixedMinValueToEnter", id),
      getTableValue<string>("OverrideMaxValuePerWinPercentage", id),
      getTableValue<Buffer>("ChallengeWinner", id)
    ])

    // Check if this entity exists (has at least a prompt or creationBlock)
    if (!prompt && !creationBlock) {
      return reply.status(404).send({
        error: "Trip not found",
        id
      })
    }

    // Check if entity type matches expected type
    if (entityType !== null && entityType !== ENTITY_TYPE.TRIP) {
      return reply.status(400).send({
        error: "Entity is not a trip",
        id,
        actualType: entityType
      })
    }

    // Convert owner buffer to hex string
    const owner = byteaToHex(ownerBuffer)

    const tripInfo: TripInfo = {
      id,
      owner,
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
      // Challenge trip fields
      challengeTrip: challengeTrip ?? false,
      fixedMinValueToEnter: formatBalance(fixedMinValueToEnter),
      overrideMaxValuePerWinPercentage: overrideMaxValuePerWinPercentage ?? null,
      challengeWinner: byteaToHex(challengeWinnerBuffer)
    }

    return reply.send(tripInfo)
  })
}

export default trip
