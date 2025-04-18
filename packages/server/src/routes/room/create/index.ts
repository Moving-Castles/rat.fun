import { FastifyInstance, FastifyRequest } from 'fastify';
import { schema } from '@routes/room/create/schema';
import dotenv from 'dotenv';

dotenv.config();

import { MESSAGE } from '@config';
import { CreateRoomBody } from '@routes/room/create/types';

// CMS
import { writeRoomToCMS } from '@modules/cms';

// MUD
import { systemCalls, network } from '@modules/mud/initMud';

// Signature
import { getSenderId } from '@modules/signature';

// Validate
import { validateInputData } from './validation';

// Error handling
import { handleError } from './errorHandling';

// Utils
import { generateRandomBytes32 } from '@modules/utils';

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

            // TODO: Check if player has enough balance to create a room

            // Check name and prompt lengths
            validateInputData(roomName, roomPrompt);

            // We need to generate a unique ID here
            // Doing it onchain does not allow us to use it to connect the room to the image
            const roomID = generateRandomBytes32(); 

            // Create room onchain
            console.time('–– Chain call');
            await systemCalls.createRoom(playerId, roomID, roomName, roomPrompt);
            console.timeEnd('–– Chain call');

            // Generate image
            console.time('–– Image generation');

            // Call the image generation API
            // Save in temp folder on server

            // Include world address in the room doc so we can clear the database of unused rooms
            const worldAddress = network?.worldContract?.address ?? "0x0";
            // Upload to sanity
            const newRoomDoc = await writeRoomToCMS(worldAddress, roomID, roomPrompt, ""); // no imagePath right now
            console.log('newRoomDoc', newRoomDoc);
            console.timeEnd('–– Image generation');

            reply.send({
                success: true,
            })
        } catch (error) {
            return handleError(error, reply);
        }
    });
}

export default routes;