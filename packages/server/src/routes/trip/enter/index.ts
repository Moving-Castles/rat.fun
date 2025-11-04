import { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/trip/enter/schema"
import { Hex } from "viem"

// Types
import {
  EnterTripData,
  EnterTripReturnValue,
  EventsReturnValue,
  CorrectionReturnValue,
  SignedRequest,
  EnterTripRequestBody
} from "@modules/types"

// LLM
import { constructEventMessages, constructCorrectionMessages } from "@modules/llm/constructMessages"

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
import { getSystemPrompts } from "@modules/cms/private"
import { writeOutcomeToCMS, updateArchetypeData } from "@modules/cms/public"

// Validation
import { validateInputData } from "./validation"
import { runDebugValidation } from "./debugValidation"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

// Archetype
import { calculateArchetypeData } from "@modules/archetypes/calculateArchetypeData"

// Utils
import { withTimeout } from "@modules/utils"

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY)

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/trip/enter",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<EnterTripRequestBody> }>, reply) => {
      try {
        // Start main processing timer
        const startProcessingTime = performance.now()

        const { tripId, ratId } = request.body.data

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = await verifyRequest(request.body)

        // * * * * * * * * * * * * * * * * * *
        // Get onchain data
        // * * * * * * * * * * * * * * * * * *

        console.time("–– Get on chain data")
        const { trip, rat, player, gamePercentagesConfig, worldEvent } = (await getEnterTripData(
          ratId,
          tripId,
          playerId
        )) as Required<EnterTripData>
        console.timeEnd("–– Get on chain data")

        // * * * * * * * * * * * * * * * * * *
        // Validate data
        // * * * * * * * * * * * * * * * * * *

        validateInputData(player, rat, trip, gamePercentagesConfig)

        // * * * * * * * * * * * * * * * * * *
        // Get system prompts from CMS
        // * * * * * * * * * * * * * * * * * *

        console.time("–– CMS")
        const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts()
        console.timeEnd("–– CMS")

        // * * * * * * * * * * * * * * * * * *
        // Construct event messages
        // * * * * * * * * * * * * * * * * * *

        console.time("–– Construct event messages")
        const eventMessages = await constructEventMessages(
          rat,
          trip,
          gamePercentagesConfig,
          worldEvent
        )
        console.timeEnd("–– Construct event messages")

        // * * * * * * * * * * * * * * * * * *
        // Call event model
        // * * * * * * * * * * * * * * * * * *

        console.time("–– Event LLM")
        const eventResults = (await callModel(
          llmClient,
          eventMessages,
          combinedSystemPrompt,
          process.env.EVENT_MODEL ?? "claude-sonnet-4-20250514",
          Number(process.env.EVENT_TEMPERATURE)
        )) as EventsReturnValue
        console.timeEnd("–– Event LLM")

        // * * * * * * * * * * * * * * * * * *
        // Apply outcome onchain
        // * * * * * * * * * * * * * * * * * *

        // Strip the debugging info from the outcome to not confuse the LLM
        const { debuggingInfo, ...unvalidatedOutcome } = eventResults.outcome

        // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
        console.time("–– Chain")
        const {
          validatedOutcome,
          newTripValue,
          tripValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange
        } = await systemCalls.applyOutcome(rat, trip, unvalidatedOutcome)
        console.timeEnd("–– Chain")

        console.log("unvalidatedOutcome", unvalidatedOutcome)
        console.log("validatedOutcome", validatedOutcome)

        // * * * * * * * * * * * * * * * * * *
        // Construct correction messages
        // * * * * * * * * * * * * * * * * * *

        // The event log might now not reflect the actual outcome.
        // Run it through the LLM again to get the corrected event log.
        console.time("–– Correction LLM")
        const correctionMessages = constructCorrectionMessages(
          unvalidatedOutcome,
          validatedOutcome,
          eventResults.log
        )

        const correctedEvents = (await callModel(
          llmClient,
          correctionMessages,
          correctionSystemPrompt,
          process.env.CORRECTION_MODEL ?? "claude-sonnet-4-20250514",
          Number(process.env.CORRECTION_TEMPERATURE)
        )) as CorrectionReturnValue
        console.timeEnd("–– Correction LLM")

        // * * * * * * * * * * * * * * * * * *
        // Debug validation
        // * * * * * * * * * * * * * * * * * *

        runDebugValidation({
          ratId: ratId as Hex,
          tripId: tripId as Hex,
          playerId,
          rat,
          trip,
          eventResults,
          validatedOutcome,
          correctedEvents,
          ratValueChange,
          tripValueChange,
          newRatBalance,
          newTripValue
        })

        // Calculate main processing time
        const mainProcessingTime = performance.now() - startProcessingTime

        // * * * * * * * * * * * * * * * * * *
        // Background actions
        // * * * * * * * * * * * * * * * * * *

        const backgroundActions = async () => {
          console.time("–– Background actions")
          try {
            // * * * * * * * * * * * * * * * * * *
            // Calculate trip archetypes
            // * * * * * * * * * * * * * * * * * *
            updateArchetypeData(tripId, calculateArchetypeData(validatedOutcome, newRatValue))

            // * * * * * * * * * * * * * * * * * *
            // Write outcome to CMS
            // * * * * * * * * * * * * * * * * * *

            writeOutcomeToCMS(
              network.worldContract?.address ?? "0x0",
              player,
              trip,
              rat,
              newTripValue,
              tripValueChange,
              newRatValue,
              ratValueChange,
              correctedEvents,
              validatedOutcome,
              mainProcessingTime,
              debuggingInfo ?? {
                internalText: "No debugging info available",
                randomSeed: 0,
                batchId: 0
              }
            )
          } catch (error) {
            handleBackgroundError(error, "Trip Entry - CMS")
          } finally {
            console.timeEnd("–– Background actions")
          }
        }

        // Start the background process without awaiting (with overall timeout of 30 seconds)
        withTimeout(backgroundActions(), 30000, "Background task timed out").catch(error => {
          console.error("Background task failed or timed out:", error)
        })

        // * * * * * * * * * * * * * * * * * *
        // Construct and send response to client
        // * * * * * * * * * * * * * * * * * *

        const response: EnterTripReturnValue = {
          id: ratId as Hex,
          log: correctedEvents.log ?? [],
          itemChanges: validatedOutcome.itemChanges,
          balanceTransfers: validatedOutcome.balanceTransfers,
          debuggingInfo: eventResults.outcome?.debuggingInfo ?? {
            internalText: "No debugging info available",
            randomSeed: 0,
            batchId: 0
          },
          ratDead: newRatBalance == 0,
          tripDepleted: newTripValue == 0
        }

        // Send response and return immediately to close connection properly
        return reply.send(response)
      } catch (error) {
        throw error
      }
    }
  )
}

export default routes
