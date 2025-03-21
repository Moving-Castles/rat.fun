import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { EnterRoomBody } from '@routes/room/enter/types';

// LLM  
import { CorrectedEventsReturnValue, CombinedReturnValue } from '@modules/llm/types'
import { constructEventMessages, constructCorrectionMessages } from '@modules/llm/constructMessages';

// Anthropic
import { getLLMClient } from '@modules/llm/anthropic';
import { callModel } from '@modules/llm/anthropic/callModel';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// Groq
// import { getLLMClient } from '@modules/llm/groq';
// import { callModel } from '@modules/llm/groq/callModel';
// const GROQ_API_KEY = process.env.GROQ_API_KEY as string;

// MUD
import { getOnchainData } from '@modules/mud/getOnchainData';
import { components, systemCalls, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts } from '@modules/cms';

// Validate
import { validateInputData } from './validation';

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY);

// Initialize LLM: Groq
// const llmClient = getLLMClient(GROQ_API_KEY);

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
            console.time('–– Get on chain data');
            const { room, rat } = getOnchainData(await network, components, ratId, roomId);
            console.timeEnd('–– Get on chain data');

            console.log('Rat:', rat);

            if(!room) {
                throw new Error('Room not found');
            }
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            validateInputData(playerId, rat, room);

            // Get system prompts from CMS
            console.time('–– CMS call');
            const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts();
            console.timeEnd('–– CMS call');

            // Call event model
            console.time('–– Combined LLM call');
            const eventMessages = constructEventMessages(rat, room);
            const combinedOutcome = await callModel(llmClient, eventMessages, combinedSystemPrompt) as CombinedReturnValue;
            console.timeEnd('–– Combined LLM call');

            console.log('Combined outcome:', combinedOutcome);

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            console.time('–– Chain call');
            const validatedOutcome = await systemCalls.applyOutcome(rat, room, combinedOutcome.outcome);
            console.timeEnd('–– Chain call');

            console.log('Validated outcome:', validatedOutcome);

            // TODO: Send message to creator, if not admin

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            console.time('–– Correction LLM call');
            const correctionMessages = constructCorrectionMessages(combinedOutcome.outcome, validatedOutcome, combinedOutcome.log);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt, 0) as CorrectedEventsReturnValue;
            console.timeEnd('–– Correction LLM call');

            console.log('Corrected events:', correctedEvents);

            reply.send({
                log: correctedEvents.logEntries ?? [],
                statChanges: validatedOutcome.statChanges,
                traitChanges: validatedOutcome.traitChanges,
                itemChanges: validatedOutcome.itemChanges,
                balanceTransfer: validatedOutcome.balanceTransfer,
            });
        } catch (error) {
            console.error('Error:', error);
            // Capture the error in Sentry
            Sentry.captureException(error);
            reply.status(500).send({ error });
        }
    });
}

export default routes;