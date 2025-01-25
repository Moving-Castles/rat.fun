import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM
import { EventsReturnValue, OutcomeReturnValue } from '@modules/llm/types'
import { constructEventMessages, constructOutcomeMessages } from '@modules/llm/constructMessages';

// Anthropic
import { getLLMClient } from '@modules/llm/anthropic';
import { callModel } from '@modules/llm/anthropic/callModel';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// DeepSeek
// import { getLLMClient } from '@modules/llm/deepseek';
// import { callModel } from '@modules/llm/deepseek/callModel';
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY as string;

// MUD
import { setup } from '@modules/mud/setup';
import { getOnchainData } from '@modules/mud/getOnchainData';
const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts } from '@modules/cms';

// Apply changes to onchain state
import { changeStats, changeTraits, changeItems, transferBalance } from './executeOutcomes';

// Initialize MUD
const {
    components,
    systemCalls,
    network,
} = await setup(ETH_PRIVATE_KEY, CHAIN_ID);

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY);

// Initialize LLM: DeepSeek
// const llmClient = getLLMClient(DEEPSEEK_API_KEY);

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    fastify.post('/room/enter', opts, async (request: FastifyRequest<{ Body: EnterRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomId,
                ratId,
            } = request.body;

            // Get onchain data
            const { room, rat } = getOnchainData(await network, components, roomId, ratId);
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            // Check that sender owns the rat
            if (rat.owner !== playerId) {
                return reply.status(403).send({ error: 'You are not the owner of the rat.' });
            } 
            
            // Check that the rat is alive
            if (rat.dead) {
                return reply.status(403).send({ error: 'The rat is dead.' });
            }

            // Check that room balance is positive
            if (room.balance <= 0) {
                return reply.status(403).send({ error: 'The room balance is not positive.' });
            }

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt } = await getSystemPrompts();

            // Call event model
            const eventMessages = constructEventMessages(room, rat);
            const events = await callModel(llmClient, eventMessages, eventSystemPrompt) as EventsReturnValue;

            // TODO: better error handling
            if(!events) {
                return reply.status(403).send({ error: 'Error: Event model call failed' });
            }

            // Call outcome model
            const outcomeMessages = constructOutcomeMessages(room, rat, events);
            const outcome = await callModel(llmClient, outcomeMessages, outcomeSystemPrompt) as OutcomeReturnValue;

            // TODO: better error handling
            if(!outcome) {
                return reply.status(403).send({ error: 'Error: Outcome model call failed' });
            }

            // Execute onchain changes based on outcome
            await changeStats(systemCalls, outcome, ratId, roomId);
            await changeTraits(systemCalls, outcome, ratId, roomId);
            await changeItems(systemCalls, outcome, ratId, roomId);
            await transferBalance(systemCalls, outcome, ratId, roomId);

            const returnObject = {
                log: events,
                statChanges: outcome.statChanges,
                traitChanges: outcome.traitChanges,
                itemChanges: outcome.itemChanges,
                balanceTransfer: outcome.balanceTransfer,
            }

            reply.send(returnObject);
        } catch (error) {
            console.error('Error:', error);
            reply.status(500).send({ error: 'An error occurred while processing the request.' });
        }
    });
}

export default routes;