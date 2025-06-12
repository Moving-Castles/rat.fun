import { FastifyReply } from 'fastify';

// Import error classes
import { SystemCallError, ContractCallError } from '@modules/mud/createSystemCalls';
import { OnchainDataError } from '@modules/mud/getOnchainData/getCreateRoomData';

/**
 * Handle errors in the Fastify route handler for room creation
 * @param error The error to handle
 * @param reply The Fastify reply object
 */
export function handleError(error: unknown, reply: FastifyReply): FastifyReply {
  console.error('Error:', error);
  
  // Handle system call errors
  if (error instanceof ContractCallError) {
    return reply.status(503).send({ 
      error: 'Contract call error', 
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

  if (error instanceof OnchainDataError) {
    return reply.status(500).send({ 
      error: 'Onchain data error', 
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