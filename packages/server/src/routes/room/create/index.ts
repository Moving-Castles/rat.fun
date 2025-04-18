import { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/room/create/schema"
import dotenv from "dotenv"

dotenv.config()

import { MESSAGE } from "@config"
import { CreateRoomBody } from "@routes/room/create/types"

// CMS
import { writeRoomToCMS } from "@modules/cms"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"

// AI
import { generateImage } from "@modules/image/generate"

// Signature
import { getSenderId } from "@modules/signature"

// Validate
import { validateInputData } from "./validation"

// Error handling
import { handleError } from "./errorHandling"

// Utils
import { generateRandomBytes32 } from "@modules/utils"

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/room/create",
    opts,
    async (request: FastifyRequest<{ Body: CreateRoomBody }>, reply) => {
      try {
        const { signature, roomName, roomPrompt } = request.body

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = getSenderId(signature, MESSAGE)

        // TODO: Check if player has enough balance to create a room

        // Check name and prompt lengths
        validateInputData(roomName, roomPrompt)

        // We need to generate a unique ID here
        // Doing it onchain does not allow us to use it to connect the room to the image
        const roomID = generateRandomBytes32()

        // Create room onchain
        console.time("–– Chain call")
        await systemCalls.createRoom(playerId, roomID, roomName, roomPrompt)
        console.timeEnd("–– Chain call")

        // Generate image
        console.time("–– Image generation")

        // let imageAssetRef = null;
        try {
          // Get the image data
          const imageBuffer = await generateImage(roomPrompt)
          // Get world addy
          const worldAddress = network?.worldContract?.address ?? "0x0"
          // Make the document
          await writeRoomToCMS(worldAddress, roomID, roomPrompt, imageBuffer)

          console.log("Successfully created new room document!")
          //
          // imageAssetRef = newRoomDoc.image.asset._ref;
        } catch (error) {
          console.error("Error", error)
        }

        reply.send({
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
      }
    }
  )
}

export default routes
