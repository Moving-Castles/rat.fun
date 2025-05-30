/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { OutcomeReturnValue } from "@modules/types"
import { SetupNetworkResult } from "./setupNetwork"
import { Rat, Room } from "@modules/types"
import { getEnterRoomData } from "@modules/mud/getOnchainData/getEnterRoomData"
import { createOutcomeCallArgs, updateOutcome } from "./outcome"
import { getRoomValue, getRatValue } from "./value"

// Custom error classes for better error handling
export class SystemCallError extends Error {
  constructor(message: string, public code: string = 'SYSTEM_CALL_ERROR') {
    super(message);
    this.name = 'SystemCallError';
  }
}

export class ContractCallError extends SystemCallError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 'CONTRACT_CALL_ERROR');
    this.name = 'ContractCallError';
  }
}

export class OutcomeUpdateError extends SystemCallError {
  constructor(message: string, public originalError?: unknown) {
    super(message, 'OUTCOME_UPDATE_ERROR');
    this.name = 'OutcomeUpdateError';
  }
}

export type SystemCalls = ReturnType<typeof createSystemCalls>

export function createSystemCalls(network: SetupNetworkResult) {
  const applyOutcome = async (
    rat: Rat,
    room: Room,
    outcome: OutcomeReturnValue
  ) => {
    try {
      const args = createOutcomeCallArgs(rat, room, outcome);
      
      // Fix for the linter error - check if worldContract has a write property
      // if (!network.worldContract || typeof network.worldContract.write !== 'function') {
      //   throw new ContractCallError('World contract write method not available');
      // }
      
      const tx = await network.worldContract.write.ratroom__applyOutcome(args);
      await network.waitForTransaction(tx);

      // Suggested outcomes were sent to the chain
      // We get the new onchain state 
      // and update the outcome with the actual changes
      try {
        const newOnChainData = await getEnterRoomData(
          rat.id,
          room.id
        );


        const validatedOutcome = updateOutcome(outcome, rat, newOnChainData.rat);
        
        const { newRoomValue, roomValueChange } = getRoomValue(room, newOnChainData.room);

        const { newRatValue, ratValueChange } = getRatValue(rat, newOnChainData.rat);

        const newRatHealth = newOnChainData.rat?.stats?.health ?? 0;

        const newRatLevelIndex = newOnChainData.level?.index ?? 0;

        return {
          validatedOutcome,
          newRoomValue,
          roomValueChange,
          newRatValue,
          ratValueChange,
          newRatHealth,
          newRatLevelIndex
        }
      } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof SystemCallError) {
          throw error;
        }
        
        // Otherwise, wrap it in our custom error
        throw new OutcomeUpdateError(
          `Error updating outcome: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error;
      }
      
      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error applying outcome: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  const createRoom = async (
    playerId: string,
    levelId: string,
    roomID: string,
    roomPrompt: string
  ) => {
    try {
      const tx = await network.worldContract.write.ratroom__createRoom([
        playerId,
        levelId,
        roomID,
        roomPrompt,
      ]);

      await network.waitForTransaction(tx);

      return true;
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error;
      }
      
      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error creating room: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  return {
    applyOutcome,
    createRoom,
  }
}
