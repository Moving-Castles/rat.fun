/**
 * Outcome Module - Handles LLM outcome formatting and validation
 *
 * FLOW:
 * 1. LLM generates an outcome (balanceTransfers, itemChanges)
 * 2. createOutcomeCallArgs() formats it for the smart contract
 * 3. Smart contract executes (may modify due to constraints)
 * 4. updateOutcome() reconciles LLM intent with chain reality
 *
 * KEY CONCEPTS:
 * - Balance transfers: Positive = Trip→Rat, Negative = Rat→Trip
 * - Item values: Always positive, adding costs trip budget, removing refunds trip
 * - Budget constraints: Contract enforces limits the LLM may exceed
 */

import { Hex } from "viem"
import { OutcomeReturnValue, ItemChange } from "@modules/types"
import { Rat, Trip } from "@modules/types"
import { handleBackgroundError } from "@modules/error-handling"
import { captureError } from "@modules/sentry"

/**
 * Parse the LLM outcome into the arguments for the smart contract's applyOutcome function
 *
 * The LLM returns a rich outcome with multiple balance transfers (step-by-step) and item changes.
 * The smart contract expects a simpler format with a single net balance transfer value.
 *
 * @param rat - The rat entering the trip
 * @param trip - The trip being entered
 * @param outcome - The outcome suggested by the LLM
 * @returns Arguments formatted for the applyOutcome contract call: [ratId, tripId, balanceTransfer, itemsToRemove, itemsToAdd]
 */
export function createOutcomeCallArgs(rat: Rat, trip: Trip, outcome: OutcomeReturnValue) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("📦 createOutcomeCallArgs - Formatting LLM outcome for contract")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Rat ID:", rat.id)
  console.log("Trip ID:", trip.id)
  console.log("Rat current balance:", rat.balance)
  console.log("Trip current balance:", trip.balance)

  // * * * * * * * * * * * * * * * * * *
  // BALANCE TRANSFERS
  // * * * * * * * * * * * * * * * * * *
  // The LLM provides step-by-step balance transfers (e.g., step 1: -50, step 2: +100)
  // The smart contract needs the NET value (sum of all transfers)
  // Positive value = Trip gives to Rat (limited by trip budget)
  // Negative value = Rat gives to Trip (limited by rat balance)

  console.log("\n📊 BALANCE TRANSFERS:")

  const balanceTransfers = outcome?.balanceTransfers ?? []

  if (balanceTransfers.length === 0) {
    console.log("  ℹ️  No balance transfers from LLM")
  } else {
    console.log(`  Found ${balanceTransfers.length} transfer(s):`)
    balanceTransfers.forEach((transfer, index) => {
      console.log(
        `    [${index}] logStep:${transfer.logStep}, amount:${transfer.amount} (type: ${typeof transfer.amount})`
      )
    })
  }

  // Verify all amounts are numbers before summing
  const invalidTransfers = balanceTransfers.filter(t => typeof t.amount !== "number")
  if (invalidTransfers.length > 0) {
    console.error("  🚨 ERROR: Found non-number amounts in balanceTransfers!")
    invalidTransfers.forEach(t => {
      console.error(`    - logStep:${t.logStep}, amount:${t.amount}, type:${typeof t.amount}`)
    })
  }

  // Sum the transfers with detailed logging
  const balanceTransfersSum = balanceTransfers.reduce((acc, curr, index) => {
    const newTotal = acc + curr.amount
    console.log(`    Sum step ${index}: ${acc} + ${curr.amount} = ${newTotal}`)
    return newTotal
  }, 0)

  console.log(`  ✅ Final sum: ${balanceTransfersSum}`)
  console.log(`  Converting to BigInt: ${BigInt(balanceTransfersSum)}`)

  // * * * * * * * * * * * * * * * * * *
  // ITEMS TO REMOVE
  // * * * * * * * * * * * * * * * * * *
  // Extract IDs of items the LLM wants to remove from rat's inventory
  // These items' values will be transferred back to the trip

  console.log("\n🗑️  ITEMS TO REMOVE:")
  const itemsToRemoveFromRat =
    (outcome?.itemChanges ?? []).filter(c => c.type === "remove").map(c => c.id) ?? []

  if (itemsToRemoveFromRat.length === 0) {
    console.log("  ℹ️  No items to remove")
  } else {
    console.log(`  Found ${itemsToRemoveFromRat.length} item(s) to remove:`)
    itemsToRemoveFromRat.forEach((id, index) => {
      const item = outcome.itemChanges?.find(c => c.id === id)
      console.log(`    [${index}] ${id} - ${item?.name} (value: ${item?.value})`)
    })
  }

  // Calculate total value of items being removed (these will refund to trip)
  const totalItemValueToRemove = itemsToRemoveFromRat
    .map(id => {
      const item = outcome.itemChanges?.find(c => c.id === id)
      return item?.value ?? 0
    })
    .reduce((sum, val) => sum + val, 0)
  console.log(`  💰 Total value to refund to trip: ${totalItemValueToRemove}`)

  // * * * * * * * * * * * * * * * * * *
  // ITEMS TO ADD
  // * * * * * * * * * * * * * * * * * *
  // Format items the LLM wants to add to rat's inventory
  // Contract expects: { name: string, value: bigint }
  // Constraints applied by contract:
  // - Max 6 items in inventory
  // - Trip must have budget to cover item value
  // - Item names limited to 48 characters

  console.log("\n➕ ITEMS TO ADD:")
  const itemsToAddToRat =
    (outcome?.itemChanges ?? [])
      .filter(c => c.type === "add")
      .map(c => {
        return {
          name: c.name.slice(0, 48), // Enforce name length limit
          value: BigInt(Math.abs(c.value)) // Item values are always positive
        }
      }) ?? []

  if (itemsToAddToRat.length === 0) {
    console.log("  ℹ️  No items to add")
  } else {
    console.log(`  Found ${itemsToAddToRat.length} item(s) to add:`)
    itemsToAddToRat.forEach((item, index) => {
      console.log(`    [${index}] ${item.name} (value: ${item.value})`)
    })
  }

  // Calculate total value of items being added (these will cost trip budget)
  const totalItemValueToAdd = itemsToAddToRat.reduce((sum, item) => sum + Number(item.value), 0)
  console.log(`  💰 Total value to deduct from trip: ${totalItemValueToAdd}`)

  // Return arguments in the format expected by ManagerSystem.applyOutcome()
  const contractArgs = [
    rat.id,
    trip.id,
    BigInt(balanceTransfersSum),
    itemsToRemoveFromRat,
    itemsToAddToRat
  ] as [Hex, Hex, bigint, Hex[], { name: string; value: bigint }[]]

  console.log("\n📤 FINAL CONTRACT ARGUMENTS:")
  console.log("  ratId:", contractArgs[0])
  console.log("  tripId:", contractArgs[1])
  console.log("  balanceTransfer (bigint):", contractArgs[2], `← from sum of ${balanceTransfersSum}`)
  console.log("  itemsToRemove:", contractArgs[3].length, "items")
  console.log("  itemsToAdd:", contractArgs[4].length, "items")
  console.log("\n💡 PREDICTED NET EFFECT:")
  console.log(
    "  Rat balance change (before constraints):",
    balanceTransfersSum - totalItemValueToRemove + totalItemValueToAdd
  )
  console.log("  Trip balance change (before constraints):", -(balanceTransfersSum + totalItemValueToAdd - totalItemValueToRemove))
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  return contractArgs
}

/**
 * Derives the actual outcome by comparing the old and new rat states after the smart contract has executed
 *
 * This function reconciles what the LLM wanted to happen (llmOutcome) with what actually happened
 * on-chain (by comparing oldRat vs newRat). The smart contract may modify the LLM's suggestions
 * based on budget constraints, inventory limits, etc.
 *
 * @param llmOutcome - The outcome suggested by the LLM (before chain execution)
 * @param oldRat - The rat's state before the trip
 * @param newRat - The rat's state after the trip (from chain)
 * @returns The validated outcome reflecting what actually happened on-chain
 */
export function updateOutcome(
  llmOutcome: OutcomeReturnValue,
  oldRat: Rat,
  newRat: Rat
): OutcomeReturnValue {
  // Deep clone the LLM outcome to avoid mutating the original
  const newOutcome = JSON.parse(JSON.stringify(llmOutcome)) as OutcomeReturnValue

  // * * * * * * * * * * * * * * * * * *
  // FIX 1 & 4: Defensive null checks and array safety
  // * * * * * * * * * * * * * * * * * *
  if (!oldRat || !newRat) {
    console.error("🚨 CRITICAL: Missing rat data in updateOutcome")
    console.error("oldRat:", oldRat)
    console.error("newRat:", newRat)

    const error = new Error("Missing Rat Data: oldRat or newRat is null/undefined in updateOutcome")
    captureError(error, {
      hasOldRat: !!oldRat,
      hasNewRat: !!newRat,
      context: "Trip Entry - Missing Rat Data"
    })
    return newOutcome
  }

  // FIX 6: Type validation - ensure balance fields are numbers (not undefined/null/bigint/string)
  const oldBalance = Number(oldRat.balance ?? 0)
  const newBalance = Number(newRat.balance ?? 0)
  const oldInventory = Array.isArray(oldRat.inventory) ? oldRat.inventory : []
  const newInventory = Array.isArray(newRat.inventory) ? newRat.inventory : []

  console.log("__ updateOutcome: Reconciling LLM suggestions with on-chain reality")
  console.log("__ Rat ID:", newRat.id)
  console.log("__ oldRat balance:", oldBalance, "inventory:", oldInventory.length)
  console.log("__ newRat balance:", newBalance, "inventory:", newInventory.length)
  console.log("__ LLM suggested balanceTransfers:", llmOutcome.balanceTransfers)

  // FIX 2: Detect rat death early
  // If rat died (balance = 0), the contract aborts and skips item processing
  const ratDied = newBalance === 0 && oldBalance > 0
  if (ratDied) {
    console.warn("⚠️  RAT DIED during trip - Contract aborted item processing at balance = 0")
    console.warn("__ Items were NOT processed due to early return in contract")
  }

  // * * * * * * * * * * * * * * * * * *
  // STEP 1: Update rat ID
  // * * * * * * * * * * * * * * * * * *

  newOutcome.id = newRat.id

  // * * * * * * * * * * * * * * * * * *
  // STEP 2: Derive actual item changes by comparing inventories
  // * * * * * * * * * * * * * * * * * *
  // The smart contract may have rejected some item changes due to:
  // - Inventory full (max 6 items)
  // - Insufficient trip budget to cover item value
  // - Rat died before item processing (contract early return)
  // We determine what ACTUALLY changed by comparing old vs new inventory

  newOutcome.itemChanges = []

  // Find items that were ADDED (exist in new but not in old)
  for (let i = 0; i < newInventory.length; i++) {
    const itemInNewRat = newInventory[i]
    const existedBefore = oldInventory.find(item => item.id === itemInNewRat.id)

    if (!existedBefore) {
      // This item was added by the contract
      const logStep = getLogStep(itemInNewRat.name, llmOutcome.itemChanges)
      newOutcome.itemChanges.push({
        logStep,
        type: "add",
        name: itemInNewRat.name,
        value: itemInNewRat.value,
        id: itemInNewRat.id
      })
    }
  }

  // Find items that were REMOVED (exist in old but not in new)
  for (let i = 0; i < oldInventory.length; i++) {
    const itemInOldRat = oldInventory[i]
    const stillExists = newInventory.find(item => item.id === itemInOldRat.id)

    if (!stillExists) {
      // This item was removed by the contract
      const logStep = getLogStep(itemInOldRat.name, llmOutcome.itemChanges)
      newOutcome.itemChanges.push({
        logStep,
        type: "remove",
        name: itemInOldRat.name,
        value: itemInOldRat.value,
        id: itemInOldRat.id
      })
    }
  }

  // FIX 5: Log actual item changes that occurred
  if (newOutcome.itemChanges.length > 0) {
    console.log("__ ✓ Actual item changes applied by contract:")
    newOutcome.itemChanges.forEach(change => {
      console.log(
        `__   - ${change.type}: ${change.name} (value: ${change.value}, logStep: ${change.logStep})`
      )
    })
  } else {
    console.log("__ No item changes occurred (may have been rejected by contract)")
  }

  // Check if LLM suggested items but none were applied
  const llmSuggestedItems = (llmOutcome.itemChanges ?? []).length > 0
  if (llmSuggestedItems && newOutcome.itemChanges.length === 0) {
    console.warn("⚠️  LLM suggested item changes, but NONE were applied by contract")
    console.warn("__ Possible reasons: inventory full, insufficient budget, or rat died")
  }

  // * * * * * * * * * * * * * * * * * *
  // STEP 3: Validate balance transfers
  // * * * * * * * * * * * * * * * * * *
  // The LLM suggests balance transfers in balanceTransfers[], which we sum and send to the contract.
  // The contract may modify this based on:
  // - Rat's available balance (can't give more than it has)
  // - Trip's budget limit (can't give more than budget allows)
  // We check if what happened matches what the LLM expected.

  newOutcome.balanceTransfers = []

  // If LLM didn't suggest any balance transfers, we're done
  if (!llmOutcome.balanceTransfers || llmOutcome.balanceTransfers.length === 0) {
    console.log("__ No balance transfers suggested by LLM")
    return newOutcome
  }

  // Calculate what the LLM expected to happen
  const expectedBalanceChange = llmOutcome.balanceTransfers.reduce(
    (acc, curr) => acc + curr.amount,
    0
  )

  // Calculate what actually happened on-chain (using type-validated numbers)
  const actualBalanceChange = newBalance - oldBalance

  // FIX 6: Type check before comparison
  if (typeof expectedBalanceChange !== "number" || typeof actualBalanceChange !== "number") {
    console.error("🚨 CRITICAL: Balance values are not numbers!")
    console.error(
      "expectedBalanceChange type:",
      typeof expectedBalanceChange,
      "value:",
      expectedBalanceChange
    )
    console.error(
      "actualBalanceChange type:",
      typeof actualBalanceChange,
      "value:",
      actualBalanceChange
    )

    const error = new Error("Invalid Balance Types: Balance values are not numbers in updateOutcome")
    captureError(error, {
      ratId: newRat.id,
      expectedType: typeof expectedBalanceChange,
      expectedValue: expectedBalanceChange,
      actualType: typeof actualBalanceChange,
      actualValue: actualBalanceChange,
      context: "Trip Entry - Invalid Balance Types"
    })
    return newOutcome
  }

  console.log(
    "__ Balance change - Expected:",
    expectedBalanceChange,
    "Actual:",
    actualBalanceChange
  )

  // * * * * * * * * * * * * * * * * * *
  // CASE 1: Expected matches actual - everything worked as planned
  // * * * * * * * * * * * * * * * * * *
  if (expectedBalanceChange === actualBalanceChange) {
    console.log("__ ✓ Balance transfer successful - LLM intent matched on-chain execution")
    newOutcome.balanceTransfers = [...llmOutcome.balanceTransfers]
    return newOutcome
  }

  // * * * * * * * * * * * * * * * * * *
  // CASE 2: Mismatch detected - contract modified or rejected the LLM's suggestion
  // * * * * * * * * * * * * * * * * * *
  // This can happen when:
  // - LLM suggested transfer exceeds available budget/balance
  // - Contract applied constraints we didn't account for
  // - There's a bug in the LLM output or our parsing

  console.error("🚨 BALANCE TRANSFER MISMATCH DETECTED")
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.error("Rat ID:", newRat.id)
  console.error("Expected (LLM):", expectedBalanceChange)
  console.error("Actual (Chain):", actualBalanceChange)
  console.error("Difference:", actualBalanceChange - expectedBalanceChange)
  console.error("Old balance:", oldBalance)
  console.error("New balance:", newBalance)
  console.error("Rat died:", ratDied)
  console.error("LLM suggested transfers:", JSON.stringify(llmOutcome.balanceTransfers, null, 2))
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  // Use consistent error message so Sentry groups all balance mismatches together
  const error = new Error(
    `Balance Transfer Mismatch: Expected does not match actual on-chain balance change`
  )

  // Add all the dynamic data as context instead of in the error message
  // This ensures Sentry groups all balance mismatches into ONE issue
  const errorContext = {
    ratId: newRat.id,
    expected: expectedBalanceChange,
    actual: actualBalanceChange,
    difference: actualBalanceChange - expectedBalanceChange,
    oldBalance,
    newBalance,
    ratDied,
    suggestedTransfers: llmOutcome.balanceTransfers,
    context: "Trip Entry - Balance Transfer Mismatch"
  }

  captureError(error, errorContext)

  // For now, we return empty balanceTransfers to indicate the mismatch
  // This means the client won't see the step-by-step transfers in the UI
  // TODO: Implement partial transfer validation - determine which transfers succeeded
  // and which failed, rather than assuming total failure
  console.log("__ Returning empty balanceTransfers array due to mismatch")

  return newOutcome
}

/**
 * Helper: Find the log step index for an item by name
 *
 * When reconciling actual vs expected outcomes, we need to preserve the logStep
 * (which log entry the item change corresponds to) from the LLM's original suggestion.
 * This allows the UI to animate/display the change at the correct point in the story.
 *
 * @param name - The item name to search for
 * @param list - The list of item changes from the LLM outcome
 * @returns The logStep index, or 0 if not found
 */
function getLogStep(name: string, list: ItemChange[]) {
  const item = list.find(i => i.name === name)
  return item?.logStep ?? 0
}
