import { FastifyReply } from 'fastify';

// Import error classes
import { OnchainDataError, RatNotFoundError, RoomNotFoundError, PlayerNotFoundError } from '@modules/mud/getOnchainData/getEnterRoomData';
import { LLMError, LLMAPIError, LLMParseError } from '@modules/llm/anthropic/callModel';
import { CMSError } from '@modules/cms';
import { SystemCallError, ContractCallError, OutcomeUpdateError } from '@modules/mud/createSystemCalls';

/**
 * Handle errors in the Fastify route handler
 * @param error The error to handle
 * @param reply The Fastify reply object
 */
export function handleError(error: unknown, reply: FastifyReply): FastifyReply {
  console.error('Error:', error);
  
  // Handle specific error types
  if (error instanceof RatNotFoundError) {
    return reply.status(404).send({ 
      error: 'Rat not found', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof RoomNotFoundError) {
    return reply.status(404).send({ 
      error: 'Room not found', 
      code: error.code,
      message: error.message 
    });
  }

  if (error instanceof PlayerNotFoundError) {
    return reply.status(404).send({ 
      error: 'Player not found', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof OnchainDataError) {
    return reply.status(400).send({ 
      error: 'Onchain data error', 
      code: error.code,
      message: error.message 
    });
  }
  
  // Handle LLM-related errors
  if (error instanceof LLMAPIError) {
    return reply.status(503).send({ 
      error: 'LLM API error', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof LLMParseError) {
    return reply.status(500).send({ 
      error: 'LLM parse error', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof LLMError) {
    return reply.status(500).send({ 
      error: 'LLM error', 
      code: error.code,
      message: error.message 
    });
  }
  
  // Handle system call errors
  if (error instanceof ContractCallError) {
    return reply.status(503).send({ 
      error: 'Contract call error', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof OutcomeUpdateError) {
    return reply.status(500).send({ 
      error: 'Outcome update error', 
      code: error.code,
      message: error.message 
    });
  }
  
  if (error instanceof SystemCallError) {
    return reply.status(500).send({ 
      error: 'System call error', 
      code: error.code,
      message: error.message 
    });
  }
  
  // Generic error handling
  return reply.status(500).send({ 
    error: 'Internal server error',
    message: error instanceof Error ? error.message : String(error)
  });
} 