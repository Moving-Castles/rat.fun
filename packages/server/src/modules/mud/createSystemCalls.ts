/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { Hex } from "viem"
import { OutcomeReturnValue } from "@modules/types"
import { SetupNetworkResult } from "./setupNetwork"
import { Rat, Trip } from "@modules/types"
import { getEnterTripData } from "@modules/mud/getOnchainData/getEnterTripData"
import { createOutcomeCallArgs, updateOutcome } from "./outcome"
import { getTripValue, getRatValue } from "./value"
import {
  SystemCallError,
  ContractCallError,
  OutcomeUpdateError
} from "@modules/error-handling/errors"

export type SystemCalls = ReturnType<typeof createSystemCalls>

export function createSystemCalls(network: SetupNetworkResult) {
  const applyOutcome = async (rat: Rat, trip: Trip, outcome: OutcomeReturnValue) => {
    try {
      const args = createOutcomeCallArgs(rat, trip, outcome)

      // Get current gas prices for speed optimization
      const feeData = await network.publicClient.estimateFeesPerGas()

      const tx = await network.worldContract.write.ratfun__applyOutcome(args, {
        maxFeePerGas: (feeData.maxFeePerGas * 150n) / 100n, // 50% higher than estimated
        maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas * 200n) / 100n, // 100% higher priority
        gas: 2000000n // Set generous gas limit
      })
      await network.waitForTransaction(tx)

      // Suggested outcomes were sent to the chain
      // We get the new onchain state
      // and update the outcome with the actual changes
      try {
        const newOnChainData = await getEnterTripData(rat.id, trip.id)

        const validatedOutcome = updateOutcome(outcome, rat, newOnChainData.rat)

        const { newTripValue, tripValueChange } = getTripValue(trip, newOnChainData.trip)

        const newRatBalance = newOnChainData.rat?.balance ?? 0

        const { newRatValue, ratValueChange } = getRatValue(rat, newOnChainData.rat)

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
