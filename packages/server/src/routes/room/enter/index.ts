import { FastifyInstance, FastifyRequest } from "fastify"
import { schema } from "@routes/room/enter/schema"

import dotenv from "dotenv"
dotenv.config()

// Types
import {
  EnterRoomData,
  EnterRoomReturnValue,
  EventsReturnValue,
  CorrectionReturnValue,
  SignedRequest,
  EnterRoomRequestBody
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
import { getEnterRoomData } from "@modules/mud/getOnchainData/getEnterRoomData"
import { systemCalls, network } from "@modules/mud/initMud"

// Signature
import { verifyRequest } from "@modules/signature"

// CMS
import { getSystemPrompts } from "@modules/cms/private"
import { writeOutcomeToCMS } from "@modules/cms/public"

// Validation
import { validateInputData } from "./validation"

import { Hex } from "viem"

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY)

const opts = { schema }

async function routes(fastify: FastifyInstance) {
  fastify.post(
    "/room/enter",
    opts,
    async (request: FastifyRequest<{ Body: SignedRequest<EnterRoomRequestBody> }>, reply) => {
      try {
        const { roomId, ratId } = request.body.data

        // Recover player address from signature and convert to MUD bytes32 format
        const playerId = await verifyRequest(request.body)

        // Get onchain data
        console.time("–– Get on chain data")
        const { room, rat, player, level, worldEvent } = (await getEnterRoomData(
          ratId,
          roomId,
          playerId
        )) as Required<EnterRoomData>
        console.timeEnd("–– Get on chain data")

        // Validate input data
        validateInputData(player, rat, room)

        // Get system prompts from CMS
        console.time("–– CMS")
        const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts()
        console.timeEnd("–– CMS")

        // Call event model
        console.time("–– Construct event messages")
        const eventMessages = await constructEventMessages(rat, room, worldEvent)
        console.timeEnd("–– Construct event messages")

        console.time("–– Event LLM")
        const eventResults = (await callModel(
          llmClient,
          eventMessages,
          combinedSystemPrompt,
          process.env.EVENT_MODEL ?? "claude-sonnet-4-20250514",
          Number(process.env.EVENT_TEMPERATURE)
        )) as EventsReturnValue
        console.timeEnd("–– Event LLM")

        // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
        console.time("–– Chain")
        const {
          validatedOutcome,
          newRoomValue,
          roomValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange,
          newRatLevelIndex
        } = await systemCalls.applyOutcome(rat, room, eventResults.outcome)
        console.timeEnd("–– Chain")

        // console.log('Validated outcome:', validatedOutcome);

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

        // Create and broadcast outcome message
        const outcomeMessage = createOutcomeMessage(
          player,
          rat,
          newRatBalance,
          room,
          validatedOutcome
        )
        await broadcast(outcomeMessage)

        console.time("–– CMS write")

        const outcomeDocument = await writeOutcomeToCMS(
          network.worldContract?.address ?? "0x0",
          player,
          room,
          rat,
          newRoomValue,
          roomValueChange,
          newRatValue,
          ratValueChange,
          correctedEvents,
          validatedOutcome
        )

        console.timeEnd("–– CMS write")

        const response: EnterRoomReturnValue = {
          id: ratId as Hex,
          log: correctedEvents.log ?? [],
          outcomeId: outcomeDocument._id,
          traitChanges: validatedOutcome.traitChanges,
          itemChanges: validatedOutcome.itemChanges,
          balanceTransfer: validatedOutcome.balanceTransfer,
          ratDead: newRatBalance == 0,
          roomDepleted: newRoomValue == 0,
          levelUp: newRatLevelIndex > level.index,
          levelDown: newRatLevelIndex < level.index
        }

        reply.send(response)
      } catch (error) {
        throw error
      }
    }
  )
}

export default routes
