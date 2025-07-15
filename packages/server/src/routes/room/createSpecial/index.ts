import type { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/room/create/schema"
import dotenv from "dotenv"

dotenv.config()

// Types
import { CreateSpecialRoomRequestBody, SignedRequest } from "@modules/types"

// CMS
import { CMSError } from "@modules/error-handling/errors"
import { writeRoomToCMS } from "@modules/cms/public"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"
import { getCreateRoomData } from "@modules/mud/getOnchainData/getCreateRoomData"

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

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/room/create-special",
    opts,
    async (
      request: FastifyRequest<{ Body: SignedRequest<CreateSpecialRoomRequestBody> }>,
      reply
    ) => {
      try {
        const { roomPrompt, levelId, roomCreationCost, maxValuePerWin } = request.body.data

        console.log("roomPrompt", roomPrompt)
        console.log("levelId", levelId)
        console.log("roomCreationCost", roomCreationCost)
        console.log("maxValuePerWin", maxValuePerWin)
        console.log("request.body", request.body)

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = await verifyRequest(request.body)

        console.log("playerId", playerId)

        // Get onchain data
        const { gameConfig, player, level } = await getCreateRoomData(playerId, levelId)

        console.log("gameConfig", gameConfig)
        console.log("player", player)
        console.log("level", level)

        // Validate data
        validateInputData(gameConfig, roomPrompt, player, level)

        // We need to generate a unique ID here
        // Doing it onchain does not allow us to use it to connect the room to the image
        const roomId = generateRandomBytes32()

        console.log("roomId", roomId)

        // Create room onchain
        console.time("–– Chain call")
        await systemCalls.createSpecialRoom(
          levelId,
          roomId,
          roomCreationCost,
          maxValuePerWin,
          roomPrompt
        )
        console.timeEnd("–– Chain call")

        // Start image generation and CMS write in the background
        const handleImageAndCMS = async () => {
          console.time("–– Image generation")
          try {
            // Get the image data
            const imageBuffer = await generateImage(roomPrompt)

            // Get world address - await the network promise first
            const resolvedNetwork = await network
            const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"

            // Write the document
            await writeRoomToCMS(worldAddress, roomId, roomPrompt, player, imageBuffer)
          } catch (error) {
            // Handle CMS-specific errors
            if (error instanceof CMSError) {
              console.error(`CMS Error: ${error.message}`, error)
              // We don't want to fail the entire request if CMS write fails
              // But we do want to log it properly
            } else {
              // For unexpected errors, log them but don't fail the request
              console.error("Unexpected error in image generation or CMS write:", error)
            }
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
