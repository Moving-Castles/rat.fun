import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';
import dotenv from 'dotenv';

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM
import Anthropic from '@anthropic-ai/sdk';
import { EventsReturnValue, OutcomeReturnValue } from '@modules/llm/types'
import { constructEventMessages, constructOutcomeMessages } from '@modules/llm/constructMessages';
import { callModel } from '@modules/llm/callModel';

// MUD
import { setup } from '@modules/mud/setup';
import { getOnchainData } from '@modules/mud/getOnchainData';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts } from '@modules/cms';

dotenv.config();

const PRIVATE_API_KEY = process.env.PRIVATE_ANTHROPIC_API_KEY as string;
const PRIVATE_ETH_KEY = process.env.PRIVATE_ETH_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

// Initialize MUD
const {
    components,
    systemCalls: { addTrait, changeStat },
    network,
} = await setup(PRIVATE_ETH_KEY, CHAIN_ID);

// Initialize LLM
const anthropic = new Anthropic({
    apiKey: PRIVATE_API_KEY
});

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    fastify.post('/room/enter', opts, async (request: FastifyRequest<{ Body: EnterRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomId,
                ratId,
            } = request.body;

            const { room, rat } = getOnchainData(await network, components, roomId, ratId);
            
            // Recover sender address from signature and convert to MUD bytes32 format
            const senderId = getSenderId(signature, MESSAGE);

            // Check that sender owns the rat
            if (rat.owner !== senderId) {
                return reply.status(403).send({ error: 'You are not the owner of the rat.' });
            } 
            
            // Check that the rat is alive
            if (rat.dead) {
                return reply.status(403).send({ error: 'The rat is dead.' });
            }

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt } = await getSystemPrompts();

            // Call event model
            const eventMessages = constructEventMessages(room, rat);
            const events = await callModel(anthropic, eventMessages, eventSystemPrompt) as EventsReturnValue;

            // TODO: error handling
            if(!events) {
                return reply.status(403).send({ error: 'Error: Event model call failed' });
            }

            // Call outcome model
            const outcomeMessages = constructOutcomeMessages(events, rat);
            const outcome = await callModel(anthropic, outcomeMessages, outcomeSystemPrompt) as OutcomeReturnValue;

            // TODO: error handling
            if(!outcome) {
                return reply.status(403).send({ error: 'Error: Outcome model call failed' });
            }

            // Add trait
            if (outcome.newTrait?.length > 0) {
                addTrait(ratId, outcome.newTrait);
            }

            // Change stats
            Object.entries(outcome.statChanges).forEach(async ([statName, change]) => {
                if (change === 0) return;
                await changeStat(ratId, statName, Math.abs(change), change < 0);
            });

            const returnObject = {
                log: events.log,
                newTrait: outcome.newTrait,
                statChanges: outcome.statChanges
            }

            reply.send(returnObject);
        } catch (error) {
            console.error('Error:', error);
            reply.status(500).send({ error: 'An error occurred while processing the request.' });
        }
    });
}

export default routes;