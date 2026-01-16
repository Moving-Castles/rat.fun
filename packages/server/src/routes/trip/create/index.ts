import type { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/trip/create/schema"
import fs from "fs"
import path from "path"

// Types
import { CreateTripRequestBody, SignedRequest } from "@modules/types"

// CMS
import { writeTripToCMS, updateTripWithImage, validateTripFolder } from "@modules/cms/public"

// MUD
import { systemCalls, network } from "@modules/mud/initMud"
import { getCreateTripData } from "@modules/mud/getOnchainData/getCreateTripData"
import { getTripIndex } from "@modules/mud/getOnchainData"

// Image generation
import { generateImage } from "@modules/image-generation/replicate"

// Signature
import { verifyRequest } from "@modules/signature"

// Validation
import {
  validateInputData,
  validateChallengeTripParams,
  CHALLENGE_FIXED_MIN_VALUE_TO_ENTER,
  CHALLENGE_MAX_WIN_PERCENTAGE
} from "./validation"

// Challenge trip min creation cost (will be read from chain once deployed)
const CHALLENGE_MIN_CREATION_COST = 5000

// Utils
import { generateRandomBytes32, withTimeout } from "@modules/utils"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/trip/create",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<CreateTripRequestBody> }>, reply) => {
      const { tripPrompt, tripCreationCost, folderId, isChallengeTrip } = request.body.data

      // Recover player address from signature and convert to MUD bytes32 format
      const { callerAddress, playerId } = await verifyRequest(request.body)

      // * * * * * * * * * * * * * * * * * *
      // Get onchain data
      // * * * * * * * * * * * * * * * * * *

      const { gameConfig, player } = await getCreateTripData(playerId)

      // * * * * * * * * * * * * * * * * * *
      // Validate data
      // * * * * * * * * * * * * * * * * * *

      validateInputData(gameConfig, player, tripPrompt, tripCreationCost)

      // Validate trip folder with user address for whitelist checking
      await validateTripFolder(folderId, callerAddress)

      // Validate challenge trip params (no whitelist check - anyone can create)
      validateChallengeTripParams(isChallengeTrip, tripCreationCost, CHALLENGE_MIN_CREATION_COST)

      // * * * * * * * * * * * * * * * * * *
      // Generate unique trip ID
      // * * * * * * * * * * * * * * * * * *

      // Doing it onchain does not allow us to use it to connect the trip to the image
      const tripId = generateRandomBytes32()

      // * * * * * * * * * * * * * * * * * *
      // Create trip onchain
      // * * * * * * * * * * * * * * * * * *

      // Use fixed values for challenge trips
      const finalFixedMinValueToEnter = isChallengeTrip
        ? CHALLENGE_FIXED_MIN_VALUE_TO_ENTER
        : undefined
      const finalMaxWinPercentage = isChallengeTrip ? CHALLENGE_MAX_WIN_PERCENTAGE : undefined

      console.time("–– Chain call")
      await systemCalls.createTrip(
        playerId,
        tripId,
        tripCreationCost,
        tripPrompt,
        isChallengeTrip,
        finalFixedMinValueToEnter,
        finalMaxWinPercentage
      )
      console.timeEnd("–– Chain call")

      // * * * * * * * * * * * * * * * * * *
      // Write trip text data to CMS
      // * * * * * * * * * * * * * * * * * *

      console.time("–– CMS text write")
      const resolvedNetwork = await network
      const worldAddress = resolvedNetwork.worldContract?.address ?? "0x0"
      const tripIndex = Number(getTripIndex(tripId))
      await writeTripToCMS(
        worldAddress,
        tripIndex,
        tripId,
        tripPrompt,
        player,
        folderId,
        tripCreationCost,
        isChallengeTrip
      )
      console.timeEnd("–– CMS text write")

      // * * * * * * * * * * * * * * * * * *
      // Background actions
      // * * * * * * * * * * * * * * * * * *

      const backgroundActions = async () => {
        console.time("–– Background actions")
        try {
          // Get the image data with timeout (30 seconds)
          const imageBuffer = await withTimeout(
            generateImage(tripPrompt),
            30000,
            "Image generation timed out"
          )

          // Update the trip document with the image
          await updateTripWithImage(tripId, imageBuffer)
        } catch (error) {
          handleBackgroundError(error, "Trip Creation - Image Generation & CMS")

          // Read default trip image static folder
          const defaultTripImagePath = path.resolve(
            process.cwd(),
            "static",
            "assets",
            "default-trip-image.png"
          )
          const defaultTripImage = fs.readFileSync(defaultTripImagePath)

          // Update the trip document with the default image
          await updateTripWithImage(tripId, defaultTripImage)
        } finally {
          console.timeEnd("–– Background actions")
        }
      }

      // Start the background process without awaiting (with overall timeout of 60 seconds)
      withTimeout(backgroundActions(), 60000, "Background task timed out").catch(error => {
        console.error("Background task failed or timed out:", error)
      })

      // * * * * * * * * * * * * * * * * * *
      // Send response to client
      // * * * * * * * * * * * * * * * * * *

      reply.send({
        success: true,
        tripId
      })
    }
  )
}

export default routes
