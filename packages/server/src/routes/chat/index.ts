import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { schema } from '@routes/chat/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { ChatRoomBody } from '@routes/chat/types';
// LLM
// import { EventsReturnValue, CombinedReturnValue } from '@modules/llm/types'
import { constructChatMessages } from '@modules/llm/constructMessages';

// Anthropic
// import { getLLMClient } from '@modules/llm/anthropic';
// import { callChatModel } from '@modules/llm/anthropic/callChatModel';
// const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// Grok
import { getLLMClient } from '@modules/llm/groq';
import { callChatModel } from '@modules/llm/groq/callChatModel';
const GROQ_API_KEY = process.env.GROQ_API_KEY as string;

// MUD
import { getOnchainData } from '@modules/mud/getOnchainData';
import { components, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts } from '@modules/cms';

// Validate
import { validateInputData } from './validation';

// Initialize LLM: Anthropic
// const llmClient = getLLMClient(ANTHROPIC_API_KEY);

// Initialize LLM: DeepSeek
// const llmClient = getLLMClient(DEEPSEEK_API_KEY);

// Initialize LLM: Heurist
// const llmClient = getLLMClient(HEURIST_API_KEY);

// Initialize LLM: Lambda
// const llmClient = getLLMClient(LAMBDA_API_KEY);

// Initialize LLM: Groq
const llmClient = getLLMClient(GROQ_API_KEY);

// Initialize LLM: Grok
// const llmClient = getLLMClient(GROK_API_KEY);

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    const handler = async (request: FastifyRequest<{ Body: ChatRoomBody }>, reply: FastifyReply) => {
        try {
            const {
                signature,
                message,
                ratId,
            } = request.body;

            // Get onchain data
            console.time('–– Get on chain data');
            const { rat } = getOnchainData(await network, components, ratId);
            console.timeEnd('–– Get on chain data');

            console.log('Rat:', rat);

            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            validateInputData(playerId, rat);

            // Get system prompts from CMS
            console.time('–– CMS call');
            const { chatSystemPrompt } = await getSystemPrompts();
            console.timeEnd('–– CMS call');

            // Call chat model
            console.time('–– Chat LLM call');
            const chatMessages = constructChatMessages(message,rat);
            const returnMessage = await callChatModel(llmClient, chatMessages, chatSystemPrompt) as string;
            console.timeEnd('–– Chat LLM call');

            console.log('Chat message:', returnMessage);

            reply.send(returnMessage);
        } catch (error) {
            console.error('Error:', error);
            // Capture the error in Sentry
            Sentry.captureException(error);
            reply.status(500).send({ error });
        }
    };

    // Register both with and without trailing slash
    fastify.post('/chat', opts, handler);
    fastify.post('/chat/', opts, handler);
}

export default routes;