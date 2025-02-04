import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter-pvp/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM
import { EventsReturnValue, PvPOutcomeReturnValue } from '@modules/llm/types'
import { constructPvPEventMessages, constructPvPOutcomeMessages, constructPvPCorrectionMessages } from '@modules/llm/constructMessages';

// Anthropic
import { getLLMClient } from '@modules/llm/anthropic';
import { callModel } from '@modules/llm/anthropic/callModel';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// MUD
import { getOnchainData } from '@modules/mud/getOnchainData';
import { components, systemCalls, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getPvPSystemPrompts } from '@modules/cms';

// Validate
import { validateInputData } from '@routes/room/enter/validation';

// Room store
import { getRats, addRat, clearRoom } from '@routes/room/enter-pvp/roomStore';

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY);

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

            console.log('room', room)
            console.log('ratA', ratA)

            if(!room) {
                throw new Error('Room not found');
            }
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            validateInputData(playerId, ratA, room);

            // Check if room already has one player
            const ratsInRoom = getRats(roomId);
            console.log("rats in room", ratsInRoom, ratsInRoom.length);
            if(ratsInRoom.length === 0) {
                // Add rat to room
                await addRat(roomId, ratId);
                return;
            }

            // We have two players in room, run the simulation...
            const { rat: ratB } = getOnchainData(await network, components, ratsInRoom[0]);

            console.log('Rat A:', ratA);
            console.log('Rat B:', ratB);

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt, correctionSystemPrompt } = await getPvPSystemPrompts();

            // Call event model
            const eventMessages = constructPvPEventMessages(ratA, ratB, room);
            const events = await callModel(llmClient, eventMessages, eventSystemPrompt) as EventsReturnValue;

            console.log('Events:', events);

            // Call outcome model
            const outcomeMessages = constructPvPOutcomeMessages(ratA, ratB, room, events);
            const unvalidatedOutcome = await callModel(llmClient, outcomeMessages, outcomeSystemPrompt) as PvPOutcomeReturnValue;

            console.log('Unvalidated outcome:', unvalidatedOutcome);

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            const validatedOutcome = {
                ratA: await systemCalls.applyOutcome(ratA, room, unvalidatedOutcome.ratA),
                ratB: await systemCalls.applyOutcome(ratB, room, unvalidatedOutcome.ratB)
            }

            console.log('Validated outcome:', validatedOutcome);

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            const correctionMessages = constructPvPCorrectionMessages(unvalidatedOutcome, validatedOutcome, events);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt) as EventsReturnValue;

            console.log('Corrected events:', correctedEvents);

            // Clear room
            clearRoom(roomId);

            const returnValue = {
                log: correctedEvents,
                ratA: validatedOutcome.ratA,
                ratB: validatedOutcome.ratB
            }

            console.log(returnValue);

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