import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { getTableValue, formatBalance } from "../utils.js"

// Request schema
const getItemSchema = z.object({
  id: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 id format")
})

// Response type
interface ItemInfo {
  id: string
  name: string | null
  value: string | null
}

const item: FastifyPluginAsync = async fastify => {
  fastify.get<{ Params: { id: string } }>("/api/psycho-object/:id", async (request, reply) => {
    const validation = getItemSchema.safeParse(request.params)
    if (!validation.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: validation.error.issues
      })
    }

    const { id } = validation.data

    // Query item data in parallel
    const [name, value] = await Promise.all([
      getTableValue<string>("Name", id),
      getTableValue<string>("Value", id)
    ])

    // Check if this entity exists (has at least a name or value)
    if (!name && !value) {
      return reply.status(404).send({
        error: "Item not found",
        id
      })
    }

    const itemInfo: ItemInfo = {
      id,
      name,
      value: formatBalance(value)
    }

    return reply.send(itemInfo)
  })
}

export default item
