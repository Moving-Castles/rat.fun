/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { Hex, parseGwei } from "viem"
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

/**
 * Gas configuration for server transactions
 */
const GAS_CONFIG = {
  MAX_FEE_GWEI: 5, // Cap at 5 gwei to prevent excessive costs during spikes
  PRIORITY_BOOST: 1.5, // 50% boost for faster inclusion (reduced from 2x)
  GAS_LIMIT: 600_000n // Conservative limit (reduced from 2M)
} as const

export function createSystemCalls(network: SetupNetworkResult) {
  /**
   * Get gas parameters for server transactions
   * Applies fee caps and priority boost based on current network conditions
   *
   * @param feeData Current network fee estimates
   * @returns Gas parameters to use for transaction
   */
  async function getGasParams(
    feeData: Awaited<ReturnType<typeof network.publicClient.estimateFeesPerGas>>
  ) {
    // Boost priority fee for faster inclusion
    const PRIORITY_MULTIPLIER = BigInt(Math.floor(GAS_CONFIG.PRIORITY_BOOST * 100))
    const basePriorityFee = feeData.maxPriorityFeePerGas ?? 0n
    const boostedPriorityFee = (basePriorityFee * PRIORITY_MULTIPLIER) / 100n

    // Cap maxFeePerGas to prevent excessive costs during spikes
    const maxFeeCapWei = parseGwei(GAS_CONFIG.MAX_FEE_GWEI.toString())
    const baseMaxFee = feeData.maxFeePerGas ?? maxFeeCapWei
    const maxFeePerGas = baseMaxFee < maxFeeCapWei ? baseMaxFee : maxFeeCapWei

    // Ensure maxPriorityFeePerGas doesn't exceed maxFeePerGas (EIP-1559 constraint)
    const maxPriorityFeePerGas =
      boostedPriorityFee > maxFeePerGas ? maxFeePerGas : boostedPriorityFee

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: GAS_CONFIG.GAS_LIMIT
    }
  }
  /**
   * Apply the outcome changes to the blockchain state
   * @param rat - The rat to apply the outcome to
   * @param trip - The trip to apply the outcome to
   * @param outcome - The outcome to apply to the rat and trip
   * @param logger - Logger for accumulating trip logs
   * @param outcomeId - The outcome ID for error tracking
   * @returns The validated outcome and calculated changes
   */
  const applyOutcome = async (
    rat: Rat,
    trip: Trip,
    outcome: OutcomeReturnValue,
    logger: TripLogger,
    outcomeId?: string
  ) => {
    try {
      // Get trip count before sending transaction
      const initialTripCount = rat.tripCount

      const args = createOutcomeCallArgs(rat, trip, outcome, logger)

      // Get gas parameters with caps and priority boost
      const feeData = await network.publicClient.estimateFeesPerGas()
      const gasParams = await getGasParams(feeData)

      const tx = await network.worldContract.write.ratfun__applyOutcome(args, gasParams)
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

        const validatedOutcome = updateOutcome(
          outcome,
          rat,
          newOnChainData.rat,
          logger,
          newOnChainData.trip as Trip,
          outcomeId
        )

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
          logger,
          outcomeId
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
      // Get gas parameters with caps and priority boost
      const feeData = await network.publicClient.estimateFeesPerGas()
      const gasParams = await getGasParams(feeData)

      const tx = await network.worldContract.write.ratfun__createTrip(
        [playerId, tripID, BigInt(tripCreationCost), tripPrompt],
        gasParams
      )

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

  return {
    applyOutcome,
    createTrip
  }
}
