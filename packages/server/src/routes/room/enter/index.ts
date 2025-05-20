import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/enter/schema';

import dotenv from 'dotenv';
dotenv.config();

// Types
import { 
    EnterRoomBody,
    EnterRoomData, 
    EnterRoomReturnValue, 
    EventsReturnValue, 
    CorrectionReturnValue 
} from '@modules/types';

// WebSocket
import { broadcast } from '@modules/websocket';
import { createOutcomeMessage } from '@modules/websocket/constructMessages';

// LLM  
import { constructEventMessages, constructCorrectionMessages } from '@modules/llm/constructMessages';

// Anthropic
import { getLLMClient } from '@modules/llm/anthropic';
import { callModel } from '@modules/llm/anthropic/callModel';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// MUD
import { getEnterRoomData } from '@modules/mud/getOnchainData/getEnterRoomData';
import { systemCalls, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// CMS
import { getSystemPrompts, writeOutcomeToCMS, CMSError } from '@modules/cms';

// Validation
import { validateInputData } from './validation';

// Error handling
import { handleError } from './errorHandling';
import { Hex } from 'viem';

// Initialize LLM: Anthropic
const llmClient = getLLMClient(ANTHROPIC_API_KEY);

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    fastify.post('/room/enter', opts, async (request: FastifyRequest<{ Body: EnterRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomId,
                ratId,
            } = request.body;

            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature);

            // Get onchain data
            console.time('–– Get on chain data');
            const { room, rat, player, level } = await getEnterRoomData(ratId, roomId, playerId) as Required<EnterRoomData>;
            console.timeEnd('–– Get on chain data');

            // Validate input data
            validateInputData(player, rat, room);

            // Get system prompts from CMS
            console.time('–– CMS');
            const { combinedSystemPrompt, correctionSystemPrompt } = await getSystemPrompts();
            console.timeEnd('–– CMS');

            // Call event model
            console.time('–– Event LLM');
            const eventMessages = constructEventMessages(rat, room, level);
            const eventResults = await callModel(llmClient, eventMessages, combinedSystemPrompt, 0) as EventsReturnValue;
            console.timeEnd('–– Event LLM');

            // console.log('Event results:', eventResults);

            // Apply the outcome suggested by the LLM to the onchain state and get back the actual outcome.
            console.time('–– Chain');
            const { 
                validatedOutcome, 
                newRoomValue, 
                roomValueChange, 
                newRatValue, 
                ratValueChange,
                newRatHealth,
                newRatLevelIndex
            } = await systemCalls.applyOutcome(rat, room, eventResults.outcome);
            console.timeEnd('–– Chain');

            // console.log('Validated outcome:', validatedOutcome);

            // The event log might now not reflect the actual outcome.
            // Run it through the LLM again to get the corrected event log.
            console.time('–– Correction LLM');
            const correctionMessages = constructCorrectionMessages(eventResults.outcome, validatedOutcome, eventResults.log);
            const correctedEvents = await callModel(llmClient, correctionMessages, correctionSystemPrompt, 0) as CorrectionReturnValue;
            console.timeEnd('–– Correction LLM');

            // console.log('Corrected events:', correctedEvents);

            // Broadcast outcome message
            const newMessage= createOutcomeMessage(player, rat, newRatHealth, room, validatedOutcome);
            await broadcast(newMessage);

            // Write outcome to CMS
            console.time('–– CMS write');
            try {
                // Await the network promise before accessing its properties
                const resolvedNetwork = await network;
                await writeOutcomeToCMS(
                    resolvedNetwork.worldContract?.address ?? "0x0",
                    player, 
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

            const response: EnterRoomReturnValue = {
                id: ratId as Hex,
                log: correctedEvents.log ?? [],
                healthChange: validatedOutcome.healthChange,
                traitChanges: validatedOutcome.traitChanges,
                itemChanges: validatedOutcome.itemChanges,
                balanceTransfer: validatedOutcome.balanceTransfer,
                ratDead: newRatHealth == 0,
                roomDepleted: newRoomValue == 0,
                levelUp: newRatLevelIndex > level.index,
                levelDown: newRatLevelIndex < level.index
            }

            reply.send(response);

        } catch (error) {
            return handleError(error, reply);
        }
    });
}

export default routes;