import type { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/trip/create/schema"
import dotenv from "dotenv"

dotenv.config()

// Types
import { CreateTripRequestBody, SignedRequest } from "@modules/types"

// CMS
import { writeTripToCMS, updateTripWithImage, getTemplateImages } from "@modules/cms/public"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"
import { getCreateTripData } from "@modules/mud/getOnchainData/getCreateTripData"
import { getTripIndex } from "@modules/mud/getOnchainData"

// Image generation
import { generateImage } from "@modules/image-generation/replicate"

// Signature
import { verifyRequest } from "@modules/signature"

// Validation
import { validateInputData } from "./validation"

// WebSocket
import { broadcast } from "@modules/websocket"
import { createTripCreationMessage } from "@modules/websocket/constructMessages"

// Utils
import { generateRandomBytes32 } from "@modules/utils"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/trip/create",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<CreateTripRequestBody> }>, reply) => {
      try {
        const { tripPrompt, tripCreationCost } = request.body.data

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = await verifyRequest(request.body)

        // Get onchain data
        const { gameConfig, player } = await getCreateTripData(playerId)

        // Validate data
        validateInputData(gameConfig, player, tripPrompt, tripCreationCost)

        // Get template images from CMS
        console.time("–– CMS")
        const templateImages = await getTemplateImages()
        console.timeEnd("–– CMS")

        // We need to generate a unique ID here
        // Doing it onchain does not allow us to use it to connect the trip to the image
        const tripId = generateRandomBytes32()

        // Create trip onchain
        console.time("–– Chain call")
        await systemCalls.createTrip(playerId, tripId, tripCreationCost, tripPrompt)
        console.timeEnd("–– Chain call")

        // Write trip text data to CMS immediately
        console.time("–– CMS text write")
        const resolvedNetwork = await network
        const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"
        const tripIndex = Number(getTripIndex(tripId))
        await writeTripToCMS(worldAddress, tripIndex, tripId, tripPrompt, player)
        console.timeEnd("–– CMS text write")

        // Start image generation and CMS image update in the background
        const handleImageGeneration = async () => {
          console.time("–– Image generation")
          try {
            // Get the image data
            const imageBuffer = await generateImage(tripPrompt, templateImages)

            // Update the trip document with the image
            await updateTripWithImage(tripId, imageBuffer)
          } catch (error) {
            handleBackgroundError(error, "Trip Creation - Image Generation & CMS")
          } finally {
            console.timeEnd("–– Image generation")
          }
        }

        // Start the background process without awaiting
        handleImageGeneration()

        // Broadcast trip creation message
        await broadcast(createTripCreationMessage(tripId, player))

        reply.send({
          success: true,
          tripId
        })
      } catch (error) {
        throw error
      }
    }
  )
}

export default routes
