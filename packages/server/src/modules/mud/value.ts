import { GamePercentagesConfig, Rat, Room } from "@modules/types"

export function getRoomValue(room: Room, newRoom: Room | undefined) {
  return {
    newRoomValue: newRoom?.balance ?? 0,
    roomValueChange: newRoom?.balance ? newRoom.balance - room.balance : 0
  }
}

export function getRoomMaxValuePerWin(roomCreationCost: number, roomBalance: number, gamePercentagesConfig: GamePercentagesConfig): number {
  // Use balance or creation cost, whichever is higher
  const costBalanceMax = Math.max(roomCreationCost, roomBalance)
  // Multiply by the configured percentage
  const result = Math.floor(gamePercentagesConfig.maxValuePerWin * costBalanceMax / 100)
  // Cap to balance
  return Math.min(result, roomBalance)
}

export function getRoomMinRatValueToEnter(roomCreationCost: number, gamePercentagesConfig: GamePercentagesConfig): number {
  return Math.floor(roomCreationCost * gamePercentagesConfig.maxValuePerWin / 100)
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
