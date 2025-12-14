import { GamePercentagesConfig, Rat, Trip } from "@modules/types"
import { TripLogger } from "@modules/logging"

export function getTripMaxValuePerWin(
  tripCreationCost: number,
  tripBalance: number,
  gamePercentagesConfig: GamePercentagesConfig
): number {
  // Use balance or creation cost, whichever is higher
  const costBalanceMax = Math.max(tripCreationCost, tripBalance)
  // Multiply by the configured percentage
  const result = Math.floor((gamePercentagesConfig.maxValuePerWin * costBalanceMax) / 100)
  // Cap to balance
  return Math.min(result, tripBalance)
}

export function getTripMinRatValueToEnter(
  tripCreationCost: number,
  gamePercentagesConfig: GamePercentagesConfig
): number {
  return Math.floor((tripCreationCost * gamePercentagesConfig.minRatValueToEnter) / 100)
}

export function getTripValue(trip: Trip, newTrip: Trip | undefined) {
  const newTripValue = newTrip?.balance ?? 0
  const tripValueChange = newTripValue - trip.balance

  // When a rat dies, trip receives rat's balance + item values
  // tripValueChange will reflect this full gain automatically
  // since the contract adds both to trip.balance

  return {
    newTripValue,
    tripValueChange
  }
}

export function getRatValue(rat: Rat, newRat: Rat, logger: TripLogger) {
  const newRatValue = calculateTotalRatValue(newRat)
  const oldRatValue = calculateTotalRatValue(rat)

  // DEATH MECHANICS:
  // When a rat dies (balance → 0):
  // - Item VALUES are transferred to trip (economically lost by rat)
  // - But items physically STAY in dead rat's inventory (gas optimization)
  // - calculateTotalRatValue counts those items, making newRatValue > 0
  // - This creates incorrect ratValueChange calculation
  //
  // FIX: If rat died, the economic loss is the FULL old value (balance + items)
  // even though items physically remained

  const ratDied = (newRat.balance ?? 0) === 0 && (rat.balance ?? 0) > 0

  if (ratDied) {
    // Rat lost everything economically (even though items stayed physically)
    const ratValueChange = -oldRatValue

    logger.log("__ getRatValue - RAT DEATH DETECTED:")
    logger.log(`__   Old rat value: ${oldRatValue} (balance + items)`)
    logger.log(`__   New rat physical value: ${newRatValue} (items still in corpse)`)
    logger.log(`__   Economic value change: ${ratValueChange} (lost everything)`)

    return {
      newRatValue: 0, // Economically worthless (dead)
      ratValueChange
    }
  }

  // Normal case: rat alive, calculate standard change
  return {
    newRatValue,
    ratValueChange: newRatValue - oldRatValue
  }
}

/**
 * Calculate the total economic value of a rat (balance + inventory)
 * Exported so it can be reused in other modules (e.g., CMS)
 */
export function calculateTotalRatValue(rat: Rat) {
  // Handle death case or missing rat
  if (!rat || !rat.balance) return 0

  const balanceValue = Number(rat.balance ?? 0)
  const inventoryValue = (rat.inventory ?? []).reduce(
    (acc, item) => acc + (Number(item?.value) || 0),
    0
  )

  return balanceValue + inventoryValue
}
