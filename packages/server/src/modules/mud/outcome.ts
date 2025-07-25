import { OutcomeReturnValue, ItemChange } from "@modules/types"
import { Rat, Room } from "@modules/types"

export function createOutcomeCallArgs(rat: Rat, room: Room, outcome: OutcomeReturnValue) {
  const balanceTransfer = outcome?.balanceTransfer?.amount ?? 0

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

  // Guard against undefined balanceTransfer
  if (!newOutcome.balanceTransfer) {
    newOutcome.balanceTransfer = {
      amount: 0,
      logStep: 0
    }
  }

  newOutcome.balanceTransfer.amount = newRat.balance - oldRat.balance

  return newOutcome
}

function getLogStep(name: string, list: ItemChange[]) {
  const item = list.find(i => i.name === name)
  return item?.logStep ?? 0
}
