import { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/trip/enter/schema"
import { Hex } from "viem"
import { v4 as uuidv4 } from "uuid"

// Types
import {
  EnterTripData,
  EnterTripReturnValue,
  SignedRequest,
  EnterTripRequestBody
} from "@modules/types"

// LLM
import { constructEventMessages, constructCorrectionMessages } from "@modules/llm/constructMessages"
import { EventsReturnValueSchema, CorrectionReturnValueSchema } from "@modules/llm/schemas"

// Anthropic
import { getLLMClient } from "@modules/llm/anthropic"
import { callModel } from "@modules/llm/anthropic/callModel"
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string

// MUD
import { getEnterTripData } from "@modules/mud/getOnchainData/getEnterTripData"
import { systemCalls, network } from "@modules/mud/initMud"

// Signature
import { verifyRequest } from "@modules/signature"

// CMS
import { getSystemPrompts, writeOutcomeToPrivateCMS } from "@modules/cms/private"
import { writeOutcomeToCMS } from "@modules/cms/public"

// Validation
import { validateInputData } from "./validation"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

// Utils
import { withTimeout } from "@modules/utils"

// Logging
import { createTripLogger } from "@modules/logging"

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY)

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/trip/enter",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<EnterTripRequestBody> }>, reply) => {
      // Extract tripId early so we can create logger before any errors
      const { tripId, ratId } = request.body.data

      // Create outcomeId early for error tracking
      const outcomeId = uuidv4()

      // Create logger for this trip (do this first to ensure cleanup on errors)
      const logger = createTripLogger(tripId)

      try {
        // Start main processing timer
        const startProcessingTime = performance.now()
        logger.log("━━━ Trip Entry Started ━━━")
        logger.log(`Rat ID: ${ratId}`)
        logger.log(`Trip ID: ${tripId}`)
        logger.log(`Outcome ID: ${outcomeId}`)

        // Recover player address from signature and convert to MUD bytes32 format
        const { playerId } = await verifyRequest(request.body)
        logger.log(`Player ID: ${playerId}`)

        // * * * * * * * * * * * * * * * * * *
        // Get onchain data
        // * * * * * * * * * * * * * * * * * *

        const onchainDataStart = performance.now()
        logger.log("Fetching onchain data...")
        const { trip, rat, player, gamePercentagesConfig, worldEvent } = (await getEnterTripData(
          ratId,
          logger,
          tripId,
          playerId
        )) as Required<EnterTripData>
        logger.log(`✓ Onchain data fetched (${Math.round(performance.now() - onchainDataStart)}ms)`)

        // * * * * * * * * * * * * * * * * * *
        // Validate data
        // * * * * * * * * * * * * * * * * * *

        validateInputData(player, rat, trip, gamePercentagesConfig)

        // * * * * * * * * * * * * * * * * * *
        // Get system prompts from CMS
        // * * * * * * * * * * * * * * * * * *

        const cmsStart = performance.now()
        logger.log("Fetching system prompts from CMS...")
        const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts()
        logger.log(`✓ System prompts fetched (${Math.round(performance.now() - cmsStart)}ms)`)

        // * * * * * * * * * * * * * * * * * *
        // Construct event messages
        // * * * * * * * * * * * * * * * * * *

        const constructStart = performance.now()
        logger.log("Constructing event messages...")
        const eventMessages = await constructEventMessages(
          rat,
          trip,
          gamePercentagesConfig,
          worldEvent
        )
        logger.log(
          `✓ Event messages constructed (${Math.round(performance.now() - constructStart)}ms)`
        )

        // * * * * * * * * * * * * * * * * * *
        // Call event model
        // * * * * * * * * * * * * * * * * * *

        const eventLLMStart = performance.now()
        logger.log("Calling event LLM...")
        const eventResults = await callModel(
          llmClient,
          eventMessages,
          combinedSystemPrompt,
          process.env.EVENT_MODEL!,
          Number(process.env.EVENT_TEMPERATURE),
          EventsReturnValueSchema
        )
        logger.log(`✓ Event LLM completed (${Math.round(performance.now() - eventLLMStart)}ms)`)

        // * * * * * * * * * * * * * * * * * *
        // Apply outcome onchain
        // * * * * * * * * * * * * * * * * * *

        // Strip the debugging info from the outcome to not confuse the LLM
        const { debuggingInfo, ...unvalidatedOutcome } = eventResults.outcome

        // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
        const chainStart = performance.now()
        logger.log("Applying outcome onchain...")
        const {
          validatedOutcome,
          newTripValue,
          tripValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange
        } = await systemCalls.applyOutcome(rat, trip, unvalidatedOutcome, logger, outcomeId)
        logger.log(`✓ Outcome applied onchain (${Math.round(performance.now() - chainStart)}ms)`)

        logger.log("Balance change: " + (newRatBalance - rat.balance))
        logger.log("Value change: " + ratValueChange)

        // Balance (aka. health) is 0 => RAT IS DEAD
        const ratDead = newRatBalance === 0

        // * * * * * * * * * * * * * * * * * *
        // Construct correction messages
        // * * * * * * * * * * * * * * * * * *

        // The event log might now not reflect the actual outcome.
        // Run it through the LLM again to get the corrected event log.
        const correctionStart = performance.now()
        logger.log("Running correction LLM...")
        const correctionMessages = constructCorrectionMessages(
          unvalidatedOutcome,
          validatedOutcome,
          eventResults.log,
          ratDead
        )

        const correctedEvents = await callModel(
          llmClient,
          correctionMessages,
          correctionSystemPrompt,
          process.env.CORRECTION_MODEL!,
          Number(process.env.CORRECTION_TEMPERATURE),
          CorrectionReturnValueSchema
        )
        logger.log(
          `✓ Correction LLM completed (${Math.round(performance.now() - correctionStart)}ms)`
        )

        // Calculate main processing time
        const mainProcessingTime = performance.now() - startProcessingTime
        logger.log(`━━━ Total processing time: ${Math.round(mainProcessingTime)}ms ━━━`)

        // * * * * * * * * * * * * * * * * * *
        // Background actions
        // * * * * * * * * * * * * * * * * * *

        const backgroundActions = async () => {
          try {
            // * * * * * * * * * * * * * * * * * *
            // Write outcome to CMS (both private and public in parallel)
            // * * * * * * * * * * * * * * * * * *

            // Get accumulated logs
            const logOutput = logger.getLogsAsString()

            // Write to both CMSs in parallel, each with independent error handling
            const writeToPrivateCMS = writeOutcomeToPrivateCMS(
              outcomeId,
              network.worldContract?.address ?? "0x0",
              player,
              trip,
              rat,
              newTripValue,
              tripValueChange,
              newRatValue,
              ratValueChange,
              newRatBalance,
              correctedEvents,
              validatedOutcome,
              mainProcessingTime,
              debuggingInfo,
              logOutput
            ).catch(error => {
              console.error(`❌ Error writing to private CMS: ${error}`)
              handleBackgroundError(error, "Trip Entry - Private CMS", { outcomeId, tripId, ratId })
            })

            const writeToPublicCMS = writeOutcomeToCMS(
              outcomeId,
              network.worldContract?.address ?? "0x0",
              player,
              trip,
              rat,
              newTripValue,
              tripValueChange,
              newRatValue,
              ratValueChange,
              newRatBalance,
              correctedEvents,
              validatedOutcome,
              mainProcessingTime
            ).catch(error => {
              console.error(`❌ Error writing to public CMS: ${error}`)
              handleBackgroundError(error, "Trip Entry - Public CMS", { outcomeId, tripId, ratId })
            })

            // Wait for both to complete
            await Promise.all([writeToPrivateCMS, writeToPublicCMS])

            // Clear logs after successful completion
            logger.clear()
          } catch (error) {
            // On error, also log it before clearing
            console.error(`❌ Error in background actions: ${error}`)
            logger.clear()
            handleBackgroundError(error, "Trip Entry - CMS", { outcomeId, tripId, ratId })
          }
        }

        // Start the background process without awaiting (with overall timeout of 30 seconds)
        withTimeout(backgroundActions(), 30000, "Background task timed out").catch(error => {
          console.error("Background task failed or timed out:", error)
          // Ensure cleanup even if timeout occurs
          logger.clear()
        })

        // * * * * * * * * * * * * * * * * * *
        // Construct and send response to client
        // * * * * * * * * * * * * * * * * * *

        const response: EnterTripReturnValue = {
          id: ratId as Hex,
          log: correctedEvents.log,
          itemChanges: validatedOutcome.itemChanges,
          balanceTransfers: validatedOutcome.balanceTransfers,
          ratDead: ratDead,
          tripDepleted: newTripValue == 0
        }

        // Send response and return immediately to close connection properly
        return reply.send(response)
      } catch (error) {
        // Clean up logger on main error path to prevent memory leak
        logger.clear()
        throw error
      }
    }
  )
}

export default routes
