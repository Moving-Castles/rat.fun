import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { getTableValue, getArrayValue, byteaToHex, formatBalance } from "../utils.js"

// Request schema
const getPlayerSchema = z.object({
  id: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Response type
interface PlayerInfo {
  id: string
  name: string | null
  balance: string | null
  currentRat: string | null
  pastRats: string[]
  creationBlock: string | null
  masterKey: boolean
}

const player: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { id: string } }>("/api/player/:id", async (request, reply) => {
    const validation = getPlayerSchema.safeParse(request.params)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { id } = validation.data

    // Query all player-related data in parallel
    const [name, balance, currentRatBuffer, pastRatsBuffers, creationBlock, masterKey] =
      await Promise.all([
        getTableValue<string>("Name", id),
        getTableValue<string>("Balance", id),
        getTableValue<Buffer>("CurrentRat", id),
        getArrayValue("PastRats", id),
        getTableValue<string>("CreationBlock", id),
        getTableValue<boolean>("MasterKey", id)
      ])

    // Check if this entity exists (has at least a name or creationBlock)
    if (!name && !creationBlock) {
      return reply.status(404).send({
        error: "Player not found",
        id
      })
    }

    // Convert buffers to hex strings
    const currentRat = byteaToHex(currentRatBuffer)
    const pastRats = pastRatsBuffers.map(b => byteaToHex(b)!).filter(Boolean)

    const playerInfo: PlayerInfo = {
      id,
      name,
      balance: formatBalance(balance),
      currentRat,
      pastRats,
      creationBlock,
      masterKey: masterKey ?? false
    }

    return reply.send(playerInfo)
  })
}

export default player
