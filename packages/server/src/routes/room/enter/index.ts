import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';
import dotenv from 'dotenv';
dotenv.config();

import { EnterRoomBody } from '@routes/room/enter/types';

// WebSocket
import { broadcast } from '@modules/websocket';
import { createOutcomeMessage } from '@modules/websocket/constructMessages';

// LLM  
import { EventsReturnValue, CorrectionReturnValue } from '@modules/llm/types'
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
import { getSystemPrompts, writeOutcomeToCMS, CMSError } from '@modules/cms';

// Validate
import { validateInputData } from './validation';

// Error handling
import { handleError } from './errorHandling';

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

            if(!room) {
                throw new Error('Room not found');
            }
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature);

            validateInputData(playerId, rat, room);

            // Get system prompts from CMS
            console.time('–– CMS');
            const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts();
            console.timeEnd('–– CMS');

            // Call event model
            console.time('–– Event LLM');
            const eventMessages = constructEventMessages(rat, room);
            const eventResults = await callModel(llmClient, eventMessages, combinedSystemPrompt) as EventsReturnValue;
            console.timeEnd('–– Event LLM');

            console.log('Event results:', eventResults);

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            console.time('–– Chain');
            const { 
                validatedOutcome, 
                newRoomValue, 
                roomValueChange, 
                newRatValue, 
                ratValueChange,
                newRatHealth
            } = await systemCalls.applyOutcome(rat, room, eventResults.outcome);
            console.timeEnd('–– Chain');

            console.log('Validated outcome:', validatedOutcome);

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            console.time('–– Correction LLM');
            const correctionMessages = constructCorrectionMessages(eventResults.outcome, validatedOutcome, eventResults.log);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt, 0) as CorrectionReturnValue;
            console.timeEnd('–– Correction LLM');

            console.log('Corrected events:', correctedEvents);

            // Broadcast outcome message
            const newMessage= createOutcomeMessage(rat, newRatHealth, room, validatedOutcome);
            await broadcast(newMessage);

            // Write outcome to CMS
            console.time('–– CMS write');
            try {
                // Await the network promise before accessing its properties
                const resolvedNetwork = await network;
                await writeOutcomeToCMS(
                    resolvedNetwork.worldContract?.address ?? "0x0",
                    playerId, 
                    room, 
                    rat,
                    newMessage.message as string,
                    newRoomValue, 
                    roomValueChange, 
                    newRatValue, 
                    ratValueChange, 
                    newRatHealth,
                    correctedEvents, 
                    validatedOutcome
                )
            } catch (error) {
                // Handle CMS-specific errors
                if (error instanceof CMSError) {
                    console.error(`CMS Error: ${error.message}`, error);
                    // We don't want to fail the entire request if CMS write fails
                    // But we do want to log it properly
                } else {
                    // For unexpected errors, log them but don't fail the request
                    console.error("Unexpected error writing to CMS:", error);
                }
            }
            console.timeEnd('–– CMS write');

            reply.send({
                log: correctedEvents.log ?? [],
                healthChange: validatedOutcome.healthChange,
                traitChanges: validatedOutcome.traitChanges,
                itemChanges: validatedOutcome.itemChanges,
                balanceTransfer: validatedOutcome.balanceTransfer
            });

        } catch (error) {
            return handleError(error, reply);
        }
    });
}

export default routes;