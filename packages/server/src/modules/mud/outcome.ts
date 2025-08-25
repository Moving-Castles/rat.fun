import { OutcomeReturnValue, ItemChange } from "@modules/types"
import { Rat, Room } from "@modules/types"

export function createOutcomeCallArgs(rat: Rat, room: Room, outcome: OutcomeReturnValue) {
  const balanceTransfer = outcome?.balanceTransfers?.reduce((sum, b) => sum + b.amount, 0) ?? 0

  // Only ID
  const itemsToRemoveFromRat =
    outcome?.itemChanges.filter(c => c.type === "remove").map(c => c.id) ?? []

  // ITEM struct
  const itemsToAddToRat =
    outcome?.itemChanges
      .filter(c => c.type === "add")
      .map(c => {
        // Limit name length
        // Value is always positive
        return { name: c.name.slice(0, 48), value: Math.abs(c.value) }
      }) ?? []

  return [rat.id, room.id, balanceTransfer, itemsToRemoveFromRat, itemsToAddToRat]
}

export function updateOutcome(
  oldOutcome: OutcomeReturnValue,
  oldRat: Rat,
  newRat: Rat
): OutcomeReturnValue {
  // Deep clone the old outcome
  const newOutcome = JSON.parse(JSON.stringify(oldOutcome))

  // - - - - - - - - -
  // ID
  // - - - - - - - - -

  newOutcome.id = newRat.id

  // - - - - - - - - -
  // ITEMS
  // - - - - - - - - -

  newOutcome.itemChanges = []

  // Iterate over items in new rat and compare with old rat
  for (let i = 0; i < newRat.inventory.length; i++) {
    // If item is not in old rat, it was added
    if (!oldRat.inventory.find(item => item.id === newRat.inventory[i].id)) {
      // Get logStep for new item
      const logStep = getLogStep(newRat.inventory[i].name, oldOutcome.itemChanges)
      newOutcome.itemChanges.push({
        logStep,
        type: "add",
        name: newRat.inventory[i].name,
        value: newRat.inventory[i].value,
        id: newRat.inventory[i].id
      })
    }
  }

  // Iterate over items in old rat and compare with new rat
  for (let i = 0; i < oldRat.inventory.length; i++) {
    // If item is not in new rat, it was removed
    if (!newRat.inventory.find(item => item.id === oldRat.inventory[i].id)) {
      // Get logStep for removed item
      const logStep = getLogStep(oldRat.inventory[i].name, oldOutcome.itemChanges)
      newOutcome.itemChanges.push({
        logStep,
        type: "remove",
        name: oldRat.inventory[i].name,
        value: oldRat.inventory[i].value,
        id: oldRat.inventory[i].id
      })
    }
  }

  // - - - - - - - - -
  // BALANCE
  // - - - - - - - - -

  // Guard against undefined balanceTransfers
  if (!newOutcome.balanceTransfers) {
    newOutcome.balanceTransfers = []
  }

  let validatedBalanceChange = newRat.balance - oldRat.balance

  // At this point we have the oldOutcome, with potentially multiple balanceTransfers taking place at multiple logSteps
  // We have a validated total balance change.
  // We need to add the balanceChanges that fit within the validatedBalanceChange to newOutcome
  // Positive balance changes are room => rat
  // Negative balance changes are rat => room

  // We need to iterate over the oldOutcome.balanceTransfers
  // add the balanceChanges that fit within the validatedBalanceChange to newOutcome
  for (let i = 0; i < oldOutcome.balanceTransfers.length; i++) {
    const balanceTransfer = oldOutcome.balanceTransfers[i]
    if (balanceTransfer.amount <= validatedBalanceChange) {
      newOutcome.balanceTransfers.push(balanceTransfer)
      validatedBalanceChange -= balanceTransfer.amount
    }
  }

  return newOutcome
}

function getLogStep(name: string, list: ItemChange[]) {
  const item = list.find(i => i.name === name)
  return item?.logStep ?? 0
}
