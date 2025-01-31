import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM
import { EventsReturnValue, OutcomeReturnValue } from '@modules/llm/types'
import { constructEventMessages, constructOutcomeMessages, constructCorrectionMessages } from '@modules/llm/constructMessages';

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
import { validateInputData } from './validation';

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

            validateInputData(playerId, rat, room);

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt, correctionSystemPrompt } = await getSystemPrompts();

            // Call event model
            const eventMessages = constructEventMessages(rat, room);
            const events = await callModel(llmClient, eventMessages, eventSystemPrompt) as EventsReturnValue;

            console.log('Events:', events);

            // Call outcome model
            const outcomeMessages = constructOutcomeMessages(rat, room, events);
            const outcome = await callModel(llmClient, outcomeMessages, outcomeSystemPrompt) as OutcomeReturnValue;

            console.log('Outcome:', outcome);

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            const actualOutcome = await systemCalls.applyOutcome(rat, room, outcome);

            console.log('Actual Outcome:', actualOutcome);

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            const correctionMessages = constructCorrectionMessages(actualOutcome, events);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt) as EventsReturnValue;

            console.log('Corrected Events:', correctedEvents);

            reply.send({
                log: correctedEvents,
                statChanges: actualOutcome.statChanges,
                traitChanges: actualOutcome.traitChanges,
                itemChanges: actualOutcome.itemChanges,
                balanceTransfer: actualOutcome.balanceTransfer,
            });
        } catch (error) {
            console.error('Error:', error);
            reply.status(500).send({ error });
        }
    });
}

export default routes;