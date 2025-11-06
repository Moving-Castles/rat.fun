/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { Hex } from "viem"
import { OutcomeReturnValue } from "@modules/types"
import { SetupNetworkResult } from "./setupNetwork"
import { Rat, Trip } from "@modules/types"
import { getEnterTripData } from "@modules/mud/getOnchainData/getEnterTripData"
import { createOutcomeCallArgs, updateOutcome, validateOutcome } from "./outcome"
import { getTripValue, getRatValue } from "./value"
import {
  SystemCallError,
  ContractCallError,
  OutcomeUpdateError
} from "@modules/error-handling/errors"
import { TripLogger } from "@modules/logging"

export type SystemCalls = ReturnType<typeof createSystemCalls>

export function createSystemCalls(network: SetupNetworkResult) {
  /**
   * Apply the outcome changes to the blockchain state
   * @param rat - The rat to apply the outcome to
   * @param trip - The trip to apply the outcome to
   * @param outcome - The outcome to apply to the rat and trip
   * @param logger - Logger for accumulating trip logs
   * @returns The validated outcome and calculated changes
   */
  const applyOutcome = async (
    rat: Rat,
    trip: Trip,
    outcome: OutcomeReturnValue,
    logger: TripLogger
  ) => {
    try {
      // Get trip count before sending transaction
      const initialTripCount = rat.tripCount

      const args = createOutcomeCallArgs(rat, trip, outcome, logger)

      // Get current gas prices for speed optimization
      const feeData = await network.publicClient.estimateFeesPerGas()

      // Calculate gas fees with multipliers
      const maxFeePerGas = (feeData.maxFeePerGas * 150n) / 100n // 50% higher than estimated
      const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 200n) / 100n // 100% higher priority

      // Ensure maxPriorityFeePerGas doesn't exceed maxFeePerGas
      const adjustedPriorityFee =
        maxPriorityFeePerGas > maxFeePerGas ? maxFeePerGas : maxPriorityFeePerGas

      const tx = await network.worldContract.write.ratfun__applyOutcome(args, {
        maxFeePerGas,
        maxPriorityFeePerGas: adjustedPriorityFee,
        gas: 2000000n // Set generous gas limit
      })
      await network.waitForTransaction(tx)

      // Suggested outcomes were sent to the chain
      // We get the new onchain state and update the outcome with the actual changes
      try {
        // Wait for store sync to update after contract execution
        // Based on tripCount increment
        const newOnChainData = await getEnterTripData(rat.id, logger, trip.id, undefined, {
          waitForUpdate: true,
          initialTripCount
        })

        const validatedOutcome = updateOutcome(outcome, rat, newOnChainData.rat, logger)

        const { newTripValue, tripValueChange } = getTripValue(trip, newOnChainData.trip)

        const newRatBalance = newOnChainData.rat?.balance ?? 0

        const { newRatValue, ratValueChange } = getRatValue(rat, newOnChainData.rat, logger)

        // Validate the outcome to ensure system invariants hold
        validateOutcome(
          newOnChainData.rat,
          trip,
          newOnChainData.trip as Trip,
          ratValueChange,
          tripValueChange,
          logger
        )

        return {
          validatedOutcome,
          newTripValue,
          tripValueChange,
          newRatBalance,
          newRatValue,
          ratValueChange
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

  /**
   * Create a new trip
   * @param playerId - The ID of the player creating the trip
   * @param tripID - The ID of the trip to create
   * @param tripCreationCost - The cost of creating the trip
   * @param tripPrompt - The prompt for the trip
   * @returns True if the trip was created successfully
   */
  const createTrip = async (
    playerId: Hex,
    tripID: Hex,
    tripCreationCost: number,
    tripPrompt: string
  ) => {
    try {
      const tx = await network.worldContract.write.ratfun__createTrip([
        playerId,
        tripID,
        BigInt(tripCreationCost),
        tripPrompt
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
        `Error creating trip: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  /**
   * Give a master key to a player
   * @param playerId - The ID of the player to give the master key to
   * @returns True if the master key was given successfully
   */
  const giveMasterKey = async (playerId: Hex) => {
    try {
      const tx = await network.worldContract.write.ratfun__giveMasterKey([playerId])
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
    createTrip,
    giveMasterKey
  }
}
