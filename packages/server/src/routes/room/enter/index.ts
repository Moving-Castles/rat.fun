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
    systemCalls: { addTrait, removeTrait, changeStat, changeRoomBalance },
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

            // Get onchain data
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

            // Check that room balance is positive
            if (room.balance <= 0) {
                return reply.status(403).send({ error: 'The room balance is not positive.' });
            }

            // Get system prompts from CMS
            const { eventSystemPrompt, outcomeSystemPrompt } = await getSystemPrompts();

            // Call event model
            const eventMessages = constructEventMessages(room, rat);
            const events = await callModel(anthropic, eventMessages, eventSystemPrompt) as EventsReturnValue;

            // TODO: better error handling
            if(!events) {
                return reply.status(403).send({ error: 'Error: Event model call failed' });
            }

            // Call outcome model
            const outcomeMessages = constructOutcomeMessages(room, rat, events);

            console.log('Outcome Messages:', outcomeMessages);

            const outcome = await callModel(anthropic, outcomeMessages, outcomeSystemPrompt) as OutcomeReturnValue;

            // TODO: better error handling
            if(!outcome) {
                return reply.status(403).send({ error: 'Error: Outcome model call failed' });
            }

            // TODO: Determine wether to add or combine/remove traits

            console.log('Outcome:', outcome);

            // Change Traits
            for( let i = 0; i < outcome.traitChanges.length; i++) {
                const traitChange = outcome.traitChanges[i];
                if(traitChange.type === "add") {
                    if(traitChange.name) {
                        addTrait(ratId, traitChange.name);
                        // Currently all traits cost 50
                        changeRoomBalance(roomId, 50, true);
                    }
                } else if(traitChange.type === "remove") {
                    if(traitChange.id) {
                        removeTrait(ratId, traitChange.id);
                    }
                }
            }

            // Change stats
            Object.entries(outcome.statChanges).forEach(async ([statName, change]) => {
                if (change === 0) return;
                const changeIsNegative = change < 0;
                await changeStat(ratId, statName, Math.abs(change), changeIsNegative);
                if(statName === "health") {
                    changeRoomBalance(roomId, Math.abs(change), !changeIsNegative);
                }
            });

            const returnObject = {
                log: events.log,
                traitChanges: outcome.traitChanges,
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