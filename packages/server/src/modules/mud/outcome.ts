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
 *
 * DEATH MECHANICS:
 * When a rat dies (balance → 0):
 * - Contract transfers rat's balance to trip
 * - Contract transfers item VALUES to trip (for accounting)
 * - Items physically STAY in dead rat's inventory (gas optimization)
 * - Contract aborts and skips further item processing
 * - Validation must account for implicit item value transfer
 */

import { Hex } from "viem"
import { OutcomeReturnValue, ItemChange } from "@modules/types"
import { Rat, Trip } from "@modules/types"
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
  console.log(
    "  balanceTransfer (bigint):",
    contractArgs[2],
    `← from sum of ${balanceTransfersSum}`
  )
  console.log("  itemsToRemove:", contractArgs[3].length, "items")
  console.log("  itemsToAdd:", contractArgs[4].length, "items")
  console.log("\n💡 PREDICTED NET EFFECT:")
  console.log(
    "  Rat balance change (before constraints):",
    balanceTransfersSum - totalItemValueToRemove + totalItemValueToAdd
  )
  console.log(
    "  Trip balance change (before constraints):",
    -(balanceTransfersSum + totalItemValueToAdd - totalItemValueToRemove)
  )
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
  // If rat died (balance = 0), special handling:
  // - Contract transfers item VALUES to trip (for accounting)
  // - But items stay in dead rat's inventory (to save gas)
  // - Contract returns early, skipping further item processing
  const ratDied = newBalance === 0 && oldBalance > 0

  if (ratDied) {
    console.warn("⚠️  RAT DIED during trip - Special death handling:")
    console.warn("__ - Rat balance → 0")
    console.warn("__ - Item VALUES transferred to trip")
    console.warn("__ - Items stay in dead rat inventory (gas optimization)")
    console.warn("__ - Contract aborted further item processing")

    // Calculate total value of items that stayed with dead rat
    const deadRatItemValue = oldInventory.reduce((sum, item) => sum + (item.value ?? 0), 0)
    console.warn(`__ - Total item value transferred: ${deadRatItemValue}`)
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
  //
  // SPECIAL CASE - RAT DEATH:
  // - Items stay in dead rat's inventory (gas optimization)
  // - But their VALUES are transferred to trip
  // - We do NOT report items as "removed" to the client (they physically stayed)
  // - But we DO account for the value transfer in balance validation below

  newOutcome.itemChanges = []

  if (ratDied) {
    // On death, items stay in inventory but we don't process new item changes
    // The client doesn't need to see items "removed" because they physically stayed
    console.log("__ Skipping item change detection - rat died, items frozen")
  } else {
    // Normal case: compare inventories to detect actual changes

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

  // SPECIAL CASE - RAT DEATH:
  // When rat dies, contract implicitly transfers item VALUES to trip (in addition to balance)
  // Even though items physically stay in dead rat's inventory
  // We need to account for this implicit item value transfer when validating
  let implicitItemValueTransfer = 0
  if (ratDied) {
    implicitItemValueTransfer = oldInventory.reduce((sum, item) => sum + (item.value ?? 0), 0)
    console.log(
      `__ Death adjustment: Contract implicitly transferred ${implicitItemValueTransfer} in item values to trip`
    )
  }

  // For validation, compare what LLM expected vs what contract actually did
  // On death, contract does: balance transfer + implicit item value transfer
  // So we need to account for that implicit transfer
  const effectiveActualBalanceChange = actualBalanceChange - implicitItemValueTransfer

  console.log("__ Balance validation:")
  console.log("__   LLM expected:", expectedBalanceChange)
  console.log("__   Actual balance change:", actualBalanceChange)
  if (ratDied) {
    console.log("__   Implicit item value transfer:", implicitItemValueTransfer)
    console.log(
      "__   Effective actual (balance + items):",
      effectiveActualBalanceChange,
      "← This should match expected"
    )
  }

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

    const error = new Error(
      "Invalid Balance Types: Balance values are not numbers in updateOutcome"
    )
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

  // * * * * * * * * * * * * * * * * * *
  // CASE 1: Expected matches actual - everything worked as planned
  // * * * * * * * * * * * * * * * * * *
  // Use effectiveActualBalanceChange which accounts for implicit item value transfer on death
  const balanceMatches = expectedBalanceChange === effectiveActualBalanceChange

  if (balanceMatches) {
    console.log("__ ✓ Balance transfer successful - LLM intent matched on-chain execution")
    if (ratDied && implicitItemValueTransfer > 0) {
      console.log(
        `__   (Note: Includes implicit ${implicitItemValueTransfer} item value transfer due to death)`
      )
    }
    newOutcome.balanceTransfers = [...llmOutcome.balanceTransfers]
    return newOutcome
  }

  // * * * * * * * * * * * * * * * * * *
  // CASE 2: Mismatch detected - contract modified the LLM's suggestion
  // * * * * * * * * * * * * * * * * * *
  // This can happen when:
  // - LLM suggested transfer exceeds available budget/balance (most common)
  // - Contract applied constraints we didn't account for
  // - LLM made math errors in calculating transfers
  //
  // STRATEGY: Scale transfers proportionally to match actual outcome
  // This preserves the narrative structure (all logSteps) while ensuring
  // the correction LLM has context to rewrite the story coherently

  // CRITICAL: Detect sign flips (LLM expected gain, contract did loss, or vice versa)
  const scaleFactor =
    expectedBalanceChange === 0 ? 1 : effectiveActualBalanceChange / expectedBalanceChange
  const isSignFlip =
    Math.sign(expectedBalanceChange) !== Math.sign(effectiveActualBalanceChange) &&
    expectedBalanceChange !== 0 &&
    effectiveActualBalanceChange !== 0

  if (isSignFlip) {
    console.error("🚨🚨🚨 CRITICAL: SIGN FLIP DETECTED 🚨🚨🚨")
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.error("CONTRACT DID THE OPPOSITE OF WHAT LLM INTENDED!")
    console.error("Rat ID:", newRat.id)
    console.error(
      "LLM expected:",
      expectedBalanceChange,
      `(${expectedBalanceChange > 0 ? "GAIN" : "LOSS"})`
    )
    console.error(
      "Contract did:",
      effectiveActualBalanceChange,
      `(${effectiveActualBalanceChange > 0 ? "GAIN" : "LOSS"})`
    )
    console.error("Scale factor:", scaleFactor, "← NEGATIVE = OPPOSITE DIRECTION")
    console.error("Old balance:", oldBalance)
    console.error("New balance:", newBalance)
    console.error("Rat died:", ratDied)
    console.error("LLM suggested transfers:", JSON.stringify(llmOutcome.balanceTransfers, null, 2))
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    // Report sign flip to Sentry as a separate critical issue
    const signFlipError = new Error(
      `CRITICAL Sign Flip: LLM expected ${expectedBalanceChange > 0 ? "gain" : "loss"}, contract did ${effectiveActualBalanceChange > 0 ? "gain" : "loss"}`
    )
    captureError(signFlipError, {
      ratId: newRat.id,
      llmExpected: expectedBalanceChange,
      llmDirection: expectedBalanceChange > 0 ? "gain" : "loss",
      contractActual: effectiveActualBalanceChange,
      contractDirection: effectiveActualBalanceChange > 0 ? "gain" : "loss",
      scaleFactor,
      oldBalance,
      newBalance,
      ratDied,
      suggestedTransfers: llmOutcome.balanceTransfers,
      context: "Trip Entry - Sign Flip"
    })
  } else {
    console.warn("⚠️  BALANCE TRANSFER MISMATCH DETECTED")
    console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.warn("Rat ID:", newRat.id)
    console.warn("Expected (LLM):", expectedBalanceChange)
    console.warn("Actual balance change:", actualBalanceChange)
    if (ratDied && implicitItemValueTransfer > 0) {
      console.warn("Implicit item value transfer (death):", implicitItemValueTransfer)
      console.warn("Effective actual (balance + items):", effectiveActualBalanceChange)
    }
    console.warn("Difference:", effectiveActualBalanceChange - expectedBalanceChange)
    console.warn("Scale factor:", scaleFactor)
    console.warn("Old balance:", oldBalance)
    console.warn("New balance:", newBalance)
    console.warn("Rat died:", ratDied)
    console.warn("LLM suggested transfers:", JSON.stringify(llmOutcome.balanceTransfers, null, 2))
    console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    // Report to Sentry for monitoring (but this is expected behavior, not critical)
    const error = new Error(
      `Balance Transfer Mismatch: Expected does not match actual on-chain balance change`
    )

    const errorContext = {
      ratId: newRat.id,
      expected: expectedBalanceChange,
      actualBalanceChange: actualBalanceChange,
      effectiveActualBalanceChange: effectiveActualBalanceChange,
      difference: effectiveActualBalanceChange - expectedBalanceChange,
      scaleFactor,
      oldBalance,
      newBalance,
      ratDied,
      implicitItemValueTransfer: ratDied ? implicitItemValueTransfer : 0,
      suggestedTransfers: llmOutcome.balanceTransfers,
      context: "Trip Entry - Balance Transfer Mismatch"
    }

    captureError(error, errorContext)
  }

  // Scale transfers proportionally to match the actual outcome
  // This ensures the user sees the progression that led to the final state
  // and gives the correction LLM context to rewrite the narrative
  console.log(
    "__ Scaling balance transfers proportionally to match actual outcome:",
    effectiveActualBalanceChange
  )

  const scaledTransfers = scaleBalanceTransfers(
    llmOutcome.balanceTransfers,
    effectiveActualBalanceChange
  )

  newOutcome.balanceTransfers = scaledTransfers

  console.log("__ ✓ Scaled transfers preserve narrative structure for correction LLM")

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

/**
 * Helper: Scale balance transfers proportionally when contract modified the outcome
 *
 * When the contract can't fulfill the LLM's balance transfer request (e.g., rat doesn't
 * have enough balance), we scale all transfers proportionally so they:
 * 1. Sum to the actual balance change that occurred
 * 2. Preserve all story beats (logSteps)
 * 3. Give the correction LLM context to rewrite the narrative
 *
 * Example:
 *   LLM suggested: [{step: 5, -15}, {step: 4, -120}] = -135
 *   Contract did: -100 (rat only had 100)
 *   Scale factor: -100 / -135 = 0.74
 *   Result: [{step: 5, -11}, {step: 4, -89}] = -100
 *
 * SIGN FLIP WARNING:
 *   If scaleFactor is negative, it means the contract did the OPPOSITE of what
 *   the LLM intended. This is critical because the narrative will contradict reality.
 *   Example: LLM says "wins +100", contract does "loses -100"
 *
 * @param transfers - The LLM's suggested transfers
 * @param targetSum - The actual balance change that occurred on-chain
 * @returns Scaled transfers that sum to targetSum
 */
function scaleBalanceTransfers(
  transfers: Array<{ logStep: number; amount: number }>,
  targetSum: number
): Array<{ logStep: number; amount: number }> {
  if (transfers.length === 0) {
    return []
  }

  console.log("__ Scaling balance transfers to match actual on-chain outcome")
  console.log("__   Original transfers:", transfers)
  console.log("__   Target sum:", targetSum)

  // Edge case: Single transfer - just use the actual value
  if (transfers.length === 1) {
    const originalAmount = transfers[0].amount
    const signFlipped = Math.sign(originalAmount) !== Math.sign(targetSum) && originalAmount !== 0 && targetSum !== 0

    if (signFlipped) {
      console.warn("__   ⚠️  SIGN FLIP: Single transfer changed from", originalAmount, "to", targetSum)
    } else {
      console.log("__   Single transfer: using actual value directly")
    }

    return [{ logStep: transfers[0].logStep, amount: targetSum }]
  }

  // Calculate scale factor
  const originalSum = transfers.reduce((sum, t) => sum + t.amount, 0)
  const scaleFactor = originalSum === 0 ? 1 : targetSum / originalSum

  console.log(`__   Scale factor: ${targetSum} / ${originalSum} = ${scaleFactor}`)

  // Warn about sign flips
  if (scaleFactor < 0) {
    console.warn("__   🚨 SIGN FLIP: Negative scale factor means ALL transfers reversed direction!")
  }

  // Scale each transfer proportionally
  const scaledTransfers = transfers.map(transfer => ({
    logStep: transfer.logStep,
    amount: Math.round(transfer.amount * scaleFactor)
  }))

  // Fix rounding errors - adjust the largest absolute value transfer
  const scaledSum = scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
  const roundingError = targetSum - scaledSum

  if (roundingError !== 0) {
    console.log(`__   Rounding error: ${roundingError}`)
    // Find transfer with largest absolute amount to adjust
    const largestIndex = scaledTransfers.reduce(
      (maxIdx, transfer, idx, arr) =>
        Math.abs(transfer.amount) > Math.abs(arr[maxIdx].amount) ? idx : maxIdx,
      0
    )
    scaledTransfers[largestIndex].amount += roundingError
    console.log(`__   Adjusted transfer [${largestIndex}] by ${roundingError}`)
  }

  console.log("__   Scaled transfers:", scaledTransfers)
  console.log(
    "__   Verification sum:",
    scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
  )

  return scaledTransfers
}
