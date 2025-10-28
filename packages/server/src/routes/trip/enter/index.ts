import { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/trip/enter/schema"
import { Hex } from "viem"

import dotenv from "dotenv"
dotenv.config()

// Types
import {
  EnterTripData,
  EnterTripReturnValue,
  EventsReturnValue,
  CorrectionReturnValue,
  SignedRequest,
  EnterTripRequestBody
} from "@modules/types"

// WebSocket
import { broadcast } from "@modules/websocket"
import { createOutcomeMessage } from "@modules/websocket/constructMessages"

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
import { writeOutcomeToCMS, updateTripFactor, getTripFactor } from "@modules/cms/public"

// Validation
import { validateInputData } from "./validation"

// Error handling
import { handleBackgroundError } from "@modules/error-handling"

// Trip factor
import { calculateTripFactor } from "@modules/trip-factor/calculateTripFactor"

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

        // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
        console.time("–– Chain")
        const {
          validatedOutcome,
          newTripValue,
          tripValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange
        } = await systemCalls.applyOutcome(rat, trip, eventResults.outcome)
        console.timeEnd("–– Chain")

        // * * * * * * * * * * * * * * * * * *
        // Construct correction messages
        // * * * * * * * * * * * * * * * * * *

        // The event log might now not reflect the actual outcome.
        // Run it through the LLM again to get the corrected event log.
        console.time("–– Correction LLM")
        const correctionMessages = constructCorrectionMessages(
          eventResults.outcome,
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

        // Calculate main processing time
        const mainProcessingTime = performance.now() - startProcessingTime

        // * * * * * * * * * * * * * * * * * *
        // Background actions
        // * * * * * * * * * * * * * * * * * *

        const backgroundActions = async () => {
          console.time("–– Background actions")
          try {
            // * * * * * * * * * * * * * * * * * *
            // Calculate trip factor
            // * * * * * * * * * * * * * * * * * *

            const oldTripFactor = (await getTripFactor(tripId)) ?? 0.5
            // console.log("oldTripFactor", oldTripFactor)
            const newTripFactor = calculateTripFactor(
              oldTripFactor,
              tripValueChange,
              newRatBalance == 0
            )
            // console.log("newTripFactor", newTripFactor)
            updateTripFactor(tripId, newTripFactor)
            // console.log("Trip factor written to CMS")

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
              eventResults.outcome?.debuggingInfo
            )

            // * * * * * * * * * * * * * * * * * *
            // Create outcome message and broadcast
            // * * * * * * * * * * * * * * * * * *

            // console.log("Creating outcome message for broadcast...")
            const outcomeMessage = createOutcomeMessage(
              player,
              rat,
              newRatBalance,
              trip,
              validatedOutcome
            )
            // console.log("Outcome message created, attempting broadcast...")

            // Fire-and-forget: don't await the broadcast
            broadcast(outcomeMessage).catch(error =>
              console.error("Failed to broadcast outcome message:", error)
            )
          } catch (error) {
            handleBackgroundError(error, "Trip Entry - CMS & WebSocket")
          } finally {
            console.timeEnd("–– Background actions")
          }
        }

        // Start the background process without awaiting
        backgroundActions()

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

        // console.log("Sending response to client...")
        // Send response and return immediately to close connection properly
        return reply.send(response)
      } catch (error) {
        throw error
      }
    }
  )
}

export default routes
