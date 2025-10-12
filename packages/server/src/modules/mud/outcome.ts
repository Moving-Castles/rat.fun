import { Hex } from "viem"
import { OutcomeReturnValue, ItemChange } from "@modules/types"
import { Rat, Trip } from "@modules/types"

/**
 * Parse the LLM outcome into the arguments for the onchain calculation
 * @param rat
 * @param trip
 * @param outcome
 * @returns The arguments for the onchain calculation
 */
export function createOutcomeCallArgs(rat: Rat, trip: Trip, outcome: OutcomeReturnValue) {
  // The onchain calculation deals with a single balance transfer value
  const balanceTransfersSum =
    (outcome?.balanceTransfers ?? []).reduce((acc, curr) => acc + curr.amount, 0) ?? 0

  // Only ID
  const itemsToRemoveFromRat =
    (outcome?.itemChanges ?? []).filter(c => c.type === "remove").map(c => c.id) ?? []

  // ITEM struct
  const itemsToAddToRat =
    (outcome?.itemChanges ?? [])
      .filter(c => c.type === "add")
      .map(c => {
        // Limit name length
        // Value is always positive
        return { name: c.name.slice(0, 48), value: BigInt(Math.abs(c.value)) }
      }) ?? []

  return [rat.id, trip.id, BigInt(balanceTransfersSum), itemsToRemoveFromRat, itemsToAddToRat] as [
    Hex,
    Hex,
    bigint,
    Hex[],
    { name: string; value: bigint }[]
  ]
}

/**
 * Derives the actual outcome by comparing the old and new rat states
 * @param llmOutcome
 * @param oldRat
 * @param newRat
 * @returns The updated outcome
 */
export function updateOutcome(
  llmOutcome: OutcomeReturnValue,
  oldRat: Rat,
  newRat: Rat
): OutcomeReturnValue {
  // Deep clone the LLM outcome
  const newOutcome = JSON.parse(JSON.stringify(llmOutcome)) as OutcomeReturnValue

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
      const logStep = getLogStep(newRat.inventory[i].name, llmOutcome.itemChanges)
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
      const logStep = getLogStep(oldRat.inventory[i].name, llmOutcome.itemChanges)
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

  // Balance transfers coming from the LLM are split into multiple steps in balanceTransfers[]
  // Before sending to the chain we sum them up into a single value above in the createOutcomeCallArgs function

  newOutcome.balanceTransfers = []

  if (!llmOutcome.balanceTransfers || llmOutcome.balanceTransfers.length === 0) {
    return newOutcome
  }

  // What the LLM suggested
  const expectedBalanceChange = llmOutcome.balanceTransfers.reduce(
    (acc, curr) => acc + curr.amount,
    0
  )

  // What actually happened
  const actualBalanceChange = newRat.balance - oldRat.balance

  // If expected and actual balance change match, all transfers were successful
  if (expectedBalanceChange == actualBalanceChange) {
    newOutcome.balanceTransfers = [...llmOutcome.balanceTransfers]
    return newOutcome
  }

  // If there is a mismatch, something went wrong
  // For now we assume that all balance transfers failed
  // TODO: deal with mismatches

  return newOutcome
}

function getLogStep(name: string, list: ItemChange[]) {
  const item = list.find(i => i.name === name)
  return item?.logStep ?? 0
}
