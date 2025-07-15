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
import {
  SystemCallError,
  ContractCallError,
  OutcomeUpdateError
} from "@modules/error-handling/errors"

export type SystemCalls = ReturnType<typeof createSystemCalls>

export function createSystemCalls(network: SetupNetworkResult) {
  const applyOutcome = async (rat: Rat, room: Room, outcome: OutcomeReturnValue) => {
    try {
      const args = createOutcomeCallArgs(rat, room, outcome)

      const tx = await (network as any).worldContract.write.ratfun__applyOutcome(args)
      await network.waitForTransaction(tx)

      // Suggested outcomes were sent to the chain
      // We get the new onchain state
      // and update the outcome with the actual changes
      try {
        const newOnChainData = await getEnterRoomData(rat.id, room.id)

        const validatedOutcome = updateOutcome(outcome, rat, newOnChainData.rat)

        const { newRoomValue, roomValueChange } = getRoomValue(room, newOnChainData.room)

        const { newRatValue, ratValueChange } = getRatValue(rat, newOnChainData.rat)

        const newRatHealth = newOnChainData.rat?.stats?.health ?? 0

        const newRatLevelIndex = newOnChainData.level?.index ?? 0

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
          throw error
        }

        // Otherwise, wrap it in our custom error
        throw new OutcomeUpdateError(
          `Error updating outcome: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
      }
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error applying outcome: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  const createRoom = async (
    playerId: string,
    levelId: string,
    roomID: string,
    roomPrompt: string
  ) => {
    try {
      const tx = await (network as any).worldContract.write.ratfun__createRoom([
        playerId,
        levelId,
        roomID,
        roomPrompt
      ])

      await network.waitForTransaction(tx)

      return true
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error creating room: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  const createSpecialRoom = async (
    levelId: string,
    roomID: string,
    roomCreationCost: number,
    maxValuePerWin: number,
    roomPrompt: string
  ) => {
    try {
      const tx = await (network as any).worldContract.write.ratfun__createSpecialRoom([
        levelId,
        roomID,
        roomCreationCost,
        maxValuePerWin,
        roomPrompt
      ])

      console.log("tx", tx)

      await network.waitForTransaction(tx)

      console.log("after tx")

      return true
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error creating room: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  const giveMasterKey = async (playerId: string) => {
    try {
      const tx = await (network as any).worldContract.write.ratfun__giveMasterKey([playerId])
      await network.waitForTransaction(tx)
      return true
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof SystemCallError) {
        throw error
      }

      // Otherwise, wrap it in our custom error
      throw new ContractCallError(
        `Error giving master key: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  return {
    applyOutcome,
    createRoom,
    createSpecialRoom,
    giveMasterKey
  }
}
