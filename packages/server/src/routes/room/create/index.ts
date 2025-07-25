import type { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/room/create/schema"
import dotenv from "dotenv"

dotenv.config()

// Types
import { CreateRoomRequestBody, SignedRequest } from "@modules/types"

// CMS
import { writeRoomToCMS, getTemplateImages } from "@modules/cms/public"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"
import { getCreateRoomData } from "@modules/mud/getOnchainData/getCreateRoomData"
import { getRoomIndex } from "@modules/mud/getOnchainData"

// Image generation
// Replicate
import { generateImage } from "@modules/image-generation/replicate"

// Signature
import { verifyRequest } from "@modules/signature"

// Validation
import { validateInputData } from "./validation"

// WebSocket
import { broadcast } from "@modules/websocket"
import { createRoomCreationMessage } from "@modules/websocket/constructMessages"

// Utils
import { generateRandomBytes32 } from "@modules/utils"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/room/create",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<CreateRoomRequestBody> }>, reply) => {
      try {
        const { roomPrompt, levelId } = request.body.data

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = await verifyRequest(request.body)

        // Get onchain data
        const { gameConfig, player, level } = await getCreateRoomData(playerId, levelId)

        // Validate data
        validateInputData(gameConfig, roomPrompt, player, level)

        // Get template images from CMS
        console.time("–– CMS")
        const templateImages = await getTemplateImages()
        console.timeEnd("–– CMS")

        // We need to generate a unique ID here
        // Doing it onchain does not allow us to use it to connect the room to the image
        const roomId = generateRandomBytes32()

        // Create room onchain
        console.time("–– Chain call")
        await systemCalls.createRoom(playerId, levelId, roomId, roomPrompt)
        console.timeEnd("–– Chain call")

        // Start image generation and CMS write in the background
        const handleImageAndCMS = async () => {
          console.time("–– Image generation")
          try {
            // Get the image data
            const imageBuffer = await generateImage(roomPrompt, templateImages)

            // Get world address - await the network promise first
            const resolvedNetwork = await network
            const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"

            const roomIndex = Number(getRoomIndex(roomId))

            // Write the document
            await writeRoomToCMS(worldAddress, roomIndex, roomId, roomPrompt, player, imageBuffer)
          } catch (error) {
            handleBackgroundError(error, "Room Creation - Image Generation & CMS")
          } finally {
            console.timeEnd("–– Image generation")
          }
        }

        // Start the background process without awaiting
        handleImageAndCMS()

        // Broadcast room creation message
        await broadcast(createRoomCreationMessage(roomId, player))

        reply.send({
          success: true,
          roomId
        })
      } catch (error) {
        throw error
      }
    }
  )
}

export default routes
