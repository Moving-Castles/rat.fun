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

// Heurist
// import { getLLMClient } from '@modules/llm/heurist';
// import { callModel } from '@modules/llm/heurist/callModel';
// const HEURIST_API_KEY = process.env.HEURIST_API_KEY as string;

// Lambda
// import { getLLMClient } from '@modules/llm/lambda';
// import { callModel } from '@modules/llm/lambda/callModel';
// const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY as string;

// MUD
import { setup } from '@modules/mud/setup';
import { getOnchainData } from '@modules/mud/getOnchainData';
const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts } from '@modules/cms';

// Validate
import { validateOutcome, validateOnchainData } from './validation';

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

// Initialize LLM: Heurist
// const llmClient = getLLMClient(HEURIST_API_KEY);

// Initialize LLM: Lambda
// const llmClient = getLLMClient(LAMBDA_API_KEY);

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

            validateOnchainData(playerId, rat, room);

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

            const validatedOutcome = await validateOutcome(outcome, rat, room);

            // Execute onchain changes based on outcome
            await changeStats(systemCalls, validatedOutcome, ratId, roomId);
            await changeTraits(systemCalls, validatedOutcome, ratId, roomId);
            await changeItems(systemCalls, validatedOutcome, ratId, roomId);
            await transferBalance(systemCalls, validatedOutcome, ratId, roomId);

            const returnObject = {
                log: events,
                statChanges: validatedOutcome.statChanges,
                traitChanges: validatedOutcome.traitChanges,
                itemChanges: validatedOutcome.itemChanges,
                balanceTransfer: validatedOutcome.balanceTransfer,
            }

            reply.send(returnObject);
        } catch (error) {
            console.error('Error:', error);
            reply.status(500).send({ error });
        }
    });
}

export default routes;