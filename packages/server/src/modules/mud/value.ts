import { Rat, Room } from "@modules/types"

export function getRoomValue(room: Room, newRoom: Room | undefined) {
  return {
    newRoomValue: newRoom?.balance ?? 0,
    roomValueChange: newRoom?.balance ? newRoom.balance - room.balance : 0
  }
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
