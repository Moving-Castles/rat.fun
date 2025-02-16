import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter-pvp/schema';
import dotenv from 'dotenv';

dotenv.config();

export const EMPTY_CONNECTION = "0x0000000000000000000000000000000000000000000000000000000000000000"

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM
import { EventsReturnValue, PvPOutcomeReturnValue } from '@modules/llm/types'
import { constructPvPEventMessages, constructPvPOutcomeMessages, constructPvPCorrectionMessages } from '@modules/llm/constructMessages';

// Anthropic
import { getLLMClient } from '@modules/llm/anthropic';
import { callModel } from '@modules/llm/anthropic/callModel';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// Groq
// import { getLLMClient } from '@modules/llm/groq';
// import { callModel } from '@modules/llm/groq/callModel';
// const GROQ_API_KEY = process.env.GROQ_API_KEY as string;

// MUD
import { getOnchainData, getRatName } from '@modules/mud/getOnchainData';
import { components, systemCalls, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getPvPSystemPrompts } from '@modules/cms';

// Validate
import { validateInputData } from '@routes/room/enter/validation';

// Websocket
import { sendToRat } from '@modules/websocket';

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY);

// Initialize LLM: Groq
// const llmClient = getLLMClient(GROQ_API_KEY);

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    fastify.post('/room/enter-pvp', opts, async (request: FastifyRequest<{ Body: EnterRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomId,
                ratId,
            } = request.body;

            // Get onchain data
            const { room, rat: ratA } = getOnchainData(await network, components, ratId, roomId);

            if(!room) {
                throw new Error('Room not found');
            }
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            validateInputData(playerId, ratA, room);
                        
            // Check if room already has one player
            if(!room.ratInRoom || room.ratInRoom === EMPTY_CONNECTION) {
                await systemCalls.placeRatInRoom(ratA, room);
                sendToRat(ratA.id, 'pvp__update', "Waiting for second rat...");
                return { message: `${getRatName(ratA.id, components.Name)} entered room`};
            }

            // We have two players in room, run the simulation...
            const { rat: ratB } = getOnchainData(await network, components, room.ratInRoom);

            // At this point:
            // - ratA is the player that just entered the room
            // - ratB is the player that was already in the room

            sendToRat(ratB.id, 'pvp__update', `Another rat entered the room: ${getRatName(ratA.id, components.Name)}`);
            sendToRat(ratA.id, 'pvp__update', `Another rat is in the room: ${getRatName(ratB.id, components.Name)}`);

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt, correctionSystemPrompt } = await getPvPSystemPrompts();

            // Call event model
            console.time('–– PvP: Event LLM call');
            const eventMessages = constructPvPEventMessages(ratA, ratB, room);
            const events = await callModel(llmClient, eventMessages, eventSystemPrompt) as EventsReturnValue;
            console.timeEnd('–– PvP: Event LLM call');

            // Call outcome model
            console.time('–– PvP: Outcome LLM call');
            const outcomeMessages = constructPvPOutcomeMessages(ratA, ratB, room, events);
            const unvalidatedOutcome = await callModel(llmClient, outcomeMessages, outcomeSystemPrompt) as PvPOutcomeReturnValue;
            console.timeEnd('–– PvP: Outcome LLM call');

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            console.time('–– PvP: chain call');
            const validatedOutcome = {
                ratA: await systemCalls.applyOutcome(ratA, room, unvalidatedOutcome.ratA),
                ratB: await systemCalls.applyOutcome(ratB, room, unvalidatedOutcome.ratB)
            }
            console.timeEnd('–– PvP: chain call');

            // TODO: Send message to creator, if not admin

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            console.time('–– PvP: Correction LLM call');
            const correctionMessages = constructPvPCorrectionMessages(unvalidatedOutcome, validatedOutcome, events);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt) as EventsReturnValue;
            console.timeEnd('–– PvP: Correction LLM call');

            const returnValue = {
                log: correctedEvents,
                ratA: validatedOutcome.ratA,
                ratB: validatedOutcome.ratB
            }

            console.log('Sending outcome to Rats via WebSocket...');
            sendToRat(ratB.id, 'pvp__outcome', returnValue);
            sendToRat(ratA.id, 'pvp__outcome', returnValue);

            reply.send(returnValue);
        } catch (error) {
            console.error('Error:', error);
            // Capture the error in Sentry
            Sentry.captureException(error);
            reply.status(500).send({ error });
        }
    });
}

export default routes;