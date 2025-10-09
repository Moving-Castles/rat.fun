import { GamePercentagesConfig, Rat, Trip } from "@modules/types"

export function getTripValue(trip: Trip, newTrip: Trip | undefined) {
  return {
    newTripValue: newTrip?.balance ?? 0,
    tripValueChange: newTrip?.balance ? newTrip.balance - trip.balance : 0
  }
}

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

export function getRatValue(rat: Rat, newRat: Rat) {
  const newRatValue = calculateTotalRatValue(newRat)
  const oldRatValue = calculateTotalRatValue(rat)
  return {
    newRatValue,
    ratValueChange: newRatValue - oldRatValue
  }
}

function calculateTotalRatValue(rat: Rat) {
  if (!rat) return 0

  const balanceValue = Number(rat.balance ?? 0)

  const inventoryValue = (rat.inventory ?? []).reduce(
    (acc, item) => acc + (Number(item?.value) ?? 0),
    0
  )

  return balanceValue + inventoryValue
}
