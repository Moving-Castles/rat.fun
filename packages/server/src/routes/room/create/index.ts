import type { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/room/create/schema"
import dotenv from "dotenv"

dotenv.config()

// Types
import { CreateRoomBody } from "@modules/types"

// CMS
import { CMSError } from "@modules/cms"
import { writeRoomToCMS } from "@modules/cms/public"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"
import { getCreateRoomData } from "@modules/mud/getOnchainData/getCreateRoomData"

// Image generation
// Replicate
import { generateImage } from "@modules/image-generation/replicate"

// Signature
import { getSenderId } from "@modules/signature"

// Validation
import { validateInputData } from "./validation"

// WebSocket
import { broadcast } from "@modules/websocket"
import { createRoomCreationMessage } from "@modules/websocket/constructMessages"

// Error handling
import { handleError } from "./errorHandling"

// Utils
import { generateRandomBytes32 } from "@modules/utils"

// Spinner utility
const spinner = {
  chars: ["/", "-", "\\", "|"],
  currentIndex: 0,
  interval: null as NodeJS.Timeout | null,

  start(message: string) {
    process.stdout.write("\x1B[?25l") // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.chars[this.currentIndex]} ${message}`)
      this.currentIndex = (this.currentIndex + 1) % this.chars.length
    }, 100)
  },

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      process.stdout.write("\r\x1B[K") // Clear line
      process.stdout.write("\x1B[?25h") // Show cursor
    }
  },
}

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/room/create",
    opts,
    async (request: FastifyRequest<{ Body: CreateRoomBody }>, reply) => {
      try {
        const { signature, roomPrompt, levelId } = request.body

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = getSenderId(signature)

        // Get onchain data
        const { gameConfig, player, level } = await getCreateRoomData(
          playerId,
          levelId
        )

        // Validate data
        validateInputData(gameConfig, roomPrompt, player, level)

        // We need to generate a unique ID here
        // Doing it onchain does not allow us to use it to connect the room to the image
        const roomId = generateRandomBytes32()

        // Create room onchain
        console.time("–– Chain call")
        await systemCalls.createRoom(playerId, levelId, roomId, roomPrompt)
        console.timeEnd("–– Chain call")

        // Start image generation and CMS write in the background
        const handleImageAndCMS = async () => {
          spinner.start("Generating image and writing to CMS...")
          console.time("–– Image generation")
          try {
            // Get the image data
            const imageBuffer = await generateImage(roomPrompt)

            // Get world address - await the network promise first
            const resolvedNetwork = await network
            const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"

            // Write the document
            await writeRoomToCMS(
              worldAddress,
              roomId,
              roomPrompt,
              player,
              imageBuffer
            )
          } catch (error) {
            // Handle CMS-specific errors
            if (error instanceof CMSError) {
              console.error(`CMS Error: ${error.message}`, error)
              // We don't want to fail the entire request if CMS write fails
              // But we do want to log it properly
            } else {
              // For unexpected errors, log them but don't fail the request
              console.error(
                "Unexpected error in image generation or CMS write:",
                error
              )
            }
          } finally {
            spinner.stop()
            console.timeEnd("–– Image generation")
          }
        }

        // Start the background process without awaiting
        handleImageAndCMS()

        // Broadcast room creation message
        await broadcast(createRoomCreationMessage(roomId, player))

        console.log("Returning Room ID", roomId)

        reply.send({
          success: true,
          roomId,
        })
      } catch (error) {
        return handleError(error, reply)
      }
    }
  )
}

export default routes
