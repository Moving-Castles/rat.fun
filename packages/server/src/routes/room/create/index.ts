import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/create/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { CreateRoomBody } from '@routes/room/create/types';

// Anthropic
// import { getLLMClient } from '@modules/llm/anthropic';
// import { callModel } from '@modules/llm/anthropic/callModel';
// const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string;

// MUD
import { systemCalls} from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// Validate
import { validateInputData } from './validation';

// Initialize LLM: Anthropic
// const llmClient = getLLMClient(ANTHROPIC_API_KEY);

const opts = { schema };  

async function routes (fastify: FastifyInstance) {
    fastify.post('/room/create', opts, async (request: FastifyRequest<{ Body: CreateRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomName,
                roomPrompt
            } = request.body;
            
            // Recover player address from signature and convert to MUD bytes32 format
            const playerId = getSenderId(signature, MESSAGE);

            // Check if player has enough balance to create a room
            // TODO

            // Check name and prompt lengths
            validateInputData(roomName, roomPrompt);

            // Create room onchain
            console.time('–– Chain call');
            await systemCalls.createRoom(playerId, roomName, roomPrompt);
            console.timeEnd('–– Chain call');

            reply.send({
                success: true,
            })
        } catch (error) {
            console.error('Error:', error);
            // Capture the error in Sentry
            Sentry.captureException(error);
            reply.status(500).send({ error });
        }
    });
}

export default routes;