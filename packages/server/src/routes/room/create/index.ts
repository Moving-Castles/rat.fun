import type { FastifyInstance, FastifyRequest } from "fastify"
import type { CreateRoomBody } from "@routes/room/create/types"

import { schema } from "@routes/room/create/schema"
import dotenv from "dotenv"

dotenv.config()

import { MESSAGE } from "@config"

// CMS
import { writeRoomToCMS, CMSError } from "@modules/cms"

// MUD
import { systemCalls, network, components } from "@modules/mud/initMud"

// Image generation
import { generateImage } from "@modules/image/generate"

// Signature
import { getSenderId } from "@modules/signature"

// Validation
import { validateInputData } from "./validation"

// WebSocket
import { broadcast } from "@modules/websocket"
import { createRoomCreationMessage } from '@modules/websocket/constructMessages';

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
        try {
          // Get the image data
          const imageBuffer = await generateImage(roomPrompt)
          
          // Get world address - await the network promise first
          const resolvedNetwork = await network
          const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"

          // Write the document
          await writeRoomToCMS(worldAddress, roomID, roomPrompt, playerId, imageBuffer)
          
        } catch (error) {
          // Handle CMS-specific errors
          if (error instanceof CMSError) {
            console.error(`CMS Error: ${error.message}`, error);
            // We don't want to fail the entire request if CMS write fails
            // But we do want to log it properly
          } else {
            // For unexpected errors, log them but don't fail the request
            console.error("Unexpected error in image generation or CMS write:", error);
          }
        }
        console.timeEnd("–– Image generation")

        // Broadcast room creation message
        const {topic, message} = createRoomCreationMessage(playerId, components.Name);
        broadcast(topic, message);

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
