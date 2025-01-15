import Anthropic from '@anthropic-ai/sdk';
import { addressToId, constructMessages, constructOutcomeMessages, recoverAddress, isNegative } from '../utils';
import type { EnterRoomBody, Outcome, Changes} from '../types';
import { MESSAGE } from '../constants';
import { getWorldPrompts } from '../cms';

import { getComponentValue } from "@latticexyz/recs";
import { setup } from "../mud/setup";

import dotenv from 'dotenv';
import type { FastifyInstance, FastifyRequest } from 'fastify';

dotenv.config();

const PRIVATE_API_KEY = process.env.PRIVATE_ANTHROPIC_API_KEY as string;
const PRIVATE_ETH_KEY = process.env.PRIVATE_ETH_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

const {
    components,
    systemCalls: { addTrait, changeStat },
    network,
} = await setup(PRIVATE_ETH_KEY, CHAIN_ID);

const anthropic = new Anthropic({
    apiKey: PRIVATE_API_KEY
});

const opts = {
    schema: {
      body: {
        type: 'object',
        required: ['signature', 'roomId', 'ratId'], // Specify required fields
        properties: {
          signature: { type: 'string', description: 'The cryptographic signature for validation' },
          roomId: { type: 'string', description: 'The ID of the room' },
          ratId: { type: 'string', description: 'The unique identifier for the rat' }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Successful response with event log and updates',
          properties: {
            eventLog: {
              type: 'array',
              items: { type: 'string' },
              description: 'An array of events that occurred'
            },
            newTrait: {
              type: 'string',
              description: 'The new trait acquired'
            },
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful'
            },
            statChanges: {
              type: 'object',
              description: 'Changes to stats after the operation',
              properties: {
                health: { type: 'integer', description: 'Change in health points' },
                strength: { type: 'integer', description: 'Change in strength points' },
                sanity: { type: 'integer', description: 'Change in sanity points' },
                intelligence: { type: 'integer', description: 'Change in intelligence points' },
                luck: { type: 'integer', description: 'Change in luck points' }
              },
            }
          },
          required: ['eventLog', 'newTrait', 'success', 'statChanges']
        },
        403: {
          type: 'object',
          description: 'Error response for forbidden access',
          properties: {
            error: { type: 'string', description: 'Error message explaining the issue' }
          },
          required: ['error']
        },
        500: {
          type: 'object',
          description: 'Error response for internal server issues',
          properties: {
            error: { type: 'string', description: 'Error message explaining the issue' }
          },
          required: ['error']
        }
      }
    }
  };  

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes (fastify: FastifyInstance, options: object) {
    fastify.post('/room/enter', opts, async (request: FastifyRequest<{ Body: EnterRoomBody }>, reply) => {
        try {
            const {
                signature,
                roomId,
                ratId,
            } = request.body;
    
            // console.log('signature', signature);
            // console.log('roomId', roomId);
            // console.log('ratId', ratId);
    
            const { systemPrompt, outcomeEvaluationPrompt } = await constructPrompts();

            const sender = addressToId(recoverAddress(signature, MESSAGE));
        
            const roomEntity = network.world.registerEntity({ id: roomId });
            const ratEntity = network.world.registerEntity({ id: ratId });
    
            const { RoomPrompt, Dead, Trait, Owner, Health, Intelligence, Strength, Sanity, Luck } = components;
    
            // Verify that rat is owned by the sender
            const ratOwner = getComponentValue(Owner, ratEntity)?.value ?? "";
            if (ratOwner !== sender) {
                return reply.status(403).send({ error: 'You are not the owner of the rat.' });
            }
    
            const ratIsDead = (getComponentValue(Dead, ratEntity)?.value) as boolean;
            if (ratIsDead) {
                console.log('The rat is dead.');
                return reply.status(403).send({ error: 'The rat is dead.' });
            }

            const roomPrompt = (getComponentValue(RoomPrompt, roomEntity)?.value  ?? "") as string;
            const ratPrompt= (getComponentValue(Trait, ratEntity)?.value ?? "") as string;

            // Get stats
            const ratHealth = getComponentValue(Health, ratEntity)?.value as number;
            const ratIntelligence = getComponentValue(Intelligence, ratEntity)?.value as number;
            const ratStrength = getComponentValue(Strength, ratEntity)?.value as number;
            const ratSanity = getComponentValue(Sanity, ratEntity)?.value as number;
            const ratLuck = getComponentValue(Luck, ratEntity)?.value as number;

            const ratStats = {
                health: Number(ratHealth),
                intelligence: Number(ratIntelligence),
                strength: Number(ratStrength),
                sanity: Number(ratSanity),
                luck: Number(ratLuck)
            };
    
            console.log('roomPrompt', roomPrompt);
            console.log('ratPrompt', ratPrompt);
            console.log('ratStats', ratStats);
    
            const messages = constructMessages(
                roomPrompt,
                ratPrompt,
                JSON.stringify(ratStats),
            );
    
            // Adjust messages to match the expected type
            const formattedMessages = messages.map(msg => {
                const formattedMessage = { role: msg.role, content: msg.content };
                if (msg.role === 'function') {
                    formattedMessage.name = msg.name;
                }
                return formattedMessage;
            });

            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                messages: formattedMessages,
                system: systemPrompt
            });
        
            // Access the text property
            const rawText = msg.content[0].text;
        
            // Parse the text into a native object
            let outcome: Outcome;
            try {
                outcome = JSON.parse(rawText);
                console.log(outcome);
            } catch (error) {
                console.error("Failed to parse JSON:", error);
                return reply.status(403).send({ error: 'Error: Failed to parse JSON' });
            }

            // Add trait
            if (outcome.change?.length > 0) {
                addTrait(ratId, outcome.change);
            }

            const outcomeMessage = constructOutcomeMessages(outcome, JSON.stringify(ratStats));

            console.log('outcomeMessage', outcomeMessage);

            const changeMsg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                messages: outcomeMessage,
                system: outcomeEvaluationPrompt
            });

            console.log('changeMsg', changeMsg);

            // Access the text property
            const rawChangesText = changeMsg.content[0].text;

            // Parse the text into a native object
            let changes: Changes;
            try {
                changes = JSON.parse(rawChangesText);
                console.log("changes", changes);
            } catch (error) {
                console.error("Failed to parse changes JSON:", error);
                return reply.status(403).send({ error: 'Error: Failed to parse changes JSON' });
            }

            Object.entries(changes).forEach(async ([statName, change]) => {
                console.log('statName', statName);
                console.log('change', change);
                await changeStat(ratId, statName, Math.abs(change), isNegative(change));
            });

            const returnObject = {
                eventLog: outcome.eventLog,
                newTrait: outcome.change,
                success: outcome.success,
                statChanges: changes
            }

            console.log('returnObject', returnObject);

            reply.send(returnObject);
        } catch (error) {
            console.error('Error:', error);
            reply.status(500).send({ error: 'An error occurred while processing the request.' });
        }
    });
}

async function constructPrompts() {
    const worldPrompts = await getWorldPrompts();
    console.log('worldPrompts', worldPrompts);
    const systemPrompt = `${worldPrompts.realityPrompt} ${worldPrompts.stylePrompt} ${worldPrompts.formatPrompt}`;
    const outcomeEvaluationPrompt = worldPrompts.outcomeEvaluationPrompt ?? "";
    return { systemPrompt, outcomeEvaluationPrompt };
}

export default routes;