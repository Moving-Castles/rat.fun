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
  // When rat dies, contract implicitly transfers item VALUES to trip
  // BUT this is NOT a balance transfer - it's item confiscation
  // balanceTransfers should ONLY reflect actual balance changes (what UI shows as health)
  // Item value losses are tracked separately via economic value calculations
  let implicitItemValueTransfer = 0
  if (ratDied) {
    implicitItemValueTransfer = oldInventory.reduce((sum, item) => sum + (item.value ?? 0), 0)
    console.log(
      `__ Death note: ${implicitItemValueTransfer} in item values will be transferred to trip (separate from balance)`
    )
  }

  console.log("__ Balance validation:")
  console.log("__   LLM expected balance change:", expectedBalanceChange)
  console.log("__   Actual balance change:", actualBalanceChange)
  if (ratDied && implicitItemValueTransfer > 0) {
    console.log(
      `__   (Plus ${implicitItemValueTransfer} in item values - tracked separately, not in balanceTransfers)`
    )
  }

  // * * * * * * * * * * * * * * * * * *
  // CASE 1: Expected matches actual - everything worked as planned
  // * * * * * * * * * * * * * * * * * *
  // Compare BALANCE changes only (not including item value transfers)
  const balanceMatches = expectedBalanceChange === actualBalanceChange

  if (balanceMatches) {
    console.log("__ ✓ Balance transfer successful - LLM intent matched on-chain execution")
    if (ratDied && implicitItemValueTransfer > 0) {
      console.log(
        `__   (Note: ${implicitItemValueTransfer} in item values transferred separately on death)`
      )
    }

    // Even when balance matches, check if the step-by-step sequence crosses zero
    // This prevents UI from showing temporary death states
    const finalBalance = oldBalance + actualBalanceChange
    const crossesZero = checkIfCrossesZero(llmOutcome.balanceTransfers, oldBalance)

    if (crossesZero && finalBalance > 0) {
      console.warn(
        "__   ⚠️  Sequence crosses zero (temporary death) even though net is correct - Dampening"
      )
      const dampenedTransfers = dampenTransfersToAvoidZero(
        llmOutcome.balanceTransfers,
        oldBalance,
        actualBalanceChange
      )
      newOutcome.balanceTransfers = dampenedTransfers
      console.log("__   Dampened transfers:", dampenedTransfers)
    } else {
      newOutcome.balanceTransfers = [...llmOutcome.balanceTransfers]
    }

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
  // STRATEGY: Scale transfers proportionally to match actual BALANCE outcome
  // balanceTransfers should ONLY reflect balance changes (what UI shows as health)
  // Item value transfers are tracked separately

  // Detect sign flips (LLM expected gain, contract did loss, or vice versa)
  const scaleFactor = expectedBalanceChange === 0 ? 1 : actualBalanceChange / expectedBalanceChange
  const isSignFlip =
    Math.sign(expectedBalanceChange) !== Math.sign(actualBalanceChange) &&
    expectedBalanceChange !== 0 &&
    actualBalanceChange !== 0

  // Log based on severity
  const logFn = isSignFlip ? console.error : console.warn
  const severity = isSignFlip ? "🚨 CRITICAL SIGN FLIP" : "⚠️  BALANCE TRANSFER MISMATCH"

  logFn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logFn(`${severity} DETECTED`)
  logFn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logFn("Rat ID:", newRat.id)
  logFn(
    "Expected (LLM):",
    expectedBalanceChange,
    `(${expectedBalanceChange > 0 ? "GAIN" : "LOSS"})`
  )
  logFn("Actual (Contract):", actualBalanceChange, `(${actualBalanceChange > 0 ? "GAIN" : "LOSS"})`)
  logFn("Difference:", actualBalanceChange - expectedBalanceChange)
  logFn("Scale factor:", scaleFactor, isSignFlip ? "← NEGATIVE = OPPOSITE DIRECTION" : "")
  logFn("Old balance:", oldBalance)
  logFn("New balance:", newBalance)
  logFn("Rat died:", ratDied)
  if (ratDied && implicitItemValueTransfer > 0) {
    logFn(
      "Note: Item values transferred separately on death:",
      implicitItemValueTransfer,
      "(NOT included in balanceTransfers)"
    )
  }
  logFn("LLM suggested transfers:", JSON.stringify(llmOutcome.balanceTransfers, null, 2))
  logFn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  // Report to Sentry
  const errorMessage = isSignFlip
    ? `Balance Transfer Mismatch (SIGN FLIP): LLM expected ${expectedBalanceChange > 0 ? "gain" : "loss"}, contract did ${actualBalanceChange > 0 ? "gain" : "loss"}`
    : `Balance Transfer Mismatch: Expected does not match actual on-chain balance change`

  const error = new Error(errorMessage)
  captureError(error, {
    ratId: newRat.id,
    isSignFlip,
    expected: expectedBalanceChange,
    actual: actualBalanceChange,
    difference: actualBalanceChange - expectedBalanceChange,
    scaleFactor,
    oldBalance,
    newBalance,
    ratDied,
    implicitItemValueTransfer: ratDied ? implicitItemValueTransfer : 0,
    suggestedTransfers: llmOutcome.balanceTransfers,
    context: "Trip Entry - Balance Transfer Mismatch"
  })

  // Scale transfers proportionally to match the actual BALANCE outcome
  // balanceTransfers represents ONLY balance/health changes (what the UI displays)
  // Item value transfers on death are tracked separately via getRatValue/getTripValue
  console.log("__ Scaling balance transfers to match actual balance change:", actualBalanceChange)
  if (ratDied && implicitItemValueTransfer > 0) {
    console.log(
      `__   (Item values of ${implicitItemValueTransfer} handled separately - not in balanceTransfers)`
    )
  }

  const scaledTransfers = scaleBalanceTransfers(
    llmOutcome.balanceTransfers,
    actualBalanceChange,
    oldBalance
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
 * 4. Avoid showing "temporary death" in UI (balance crossing zero then recovering)
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
 * @param startingBalance - The rat's balance before any transfers (to check for zero-crossing)
 * @returns Scaled transfers that sum to targetSum and avoid crossing zero
 */
function scaleBalanceTransfers(
  transfers: Array<{ logStep: number; amount: number }>,
  targetSum: number,
  startingBalance: number
): Array<{ logStep: number; amount: number }> {
  if (transfers.length === 0) {
    return []
  }

  console.log("__ Scaling balance transfers to match actual on-chain outcome")
  console.log("__   Starting balance:", startingBalance)
  console.log("__   Original transfers:", transfers)
  console.log("__   Target sum:", targetSum)

  // Edge case: Single transfer - just use the actual value
  if (transfers.length === 1) {
    const originalAmount = transfers[0].amount
    const signFlipped =
      Math.sign(originalAmount) !== Math.sign(targetSum) && originalAmount !== 0 && targetSum !== 0

    if (signFlipped) {
      console.warn(
        "__   ⚠️  SIGN FLIP: Single transfer changed from",
        originalAmount,
        "to",
        targetSum
      )
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
  let scaledTransfers = transfers.map(transfer => ({
    logStep: transfer.logStep,
    amount: Math.round(transfer.amount * scaleFactor)
  }))

  // Fix rounding errors - adjust the largest absolute value transfer
  let scaledSum = scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
  const roundingError = targetSum - scaledSum

  if (roundingError !== 0) {
    console.log(`__   Rounding error: ${roundingError}`)
    const largestIndex = scaledTransfers.reduce(
      (maxIdx, transfer, idx, arr) =>
        Math.abs(transfer.amount) > Math.abs(arr[maxIdx].amount) ? idx : maxIdx,
      0
    )
    scaledTransfers[largestIndex].amount += roundingError
    console.log(`__   Adjusted transfer [${largestIndex}] by ${roundingError}`)
  }

  // Check if transfers cross zero during progression (rat "dies" then recovers)
  // This creates awkward UI where health bar shows death → resurrection
  const finalBalance = startingBalance + targetSum
  const crossesZero = checkIfCrossesZero(scaledTransfers, startingBalance)

  if (crossesZero && finalBalance > 0) {
    console.warn(
      "__   ⚠️  TRANSFERS CROSS ZERO (temporary death) - Dampening to avoid UI confusion"
    )

    // Dampen the swings while maintaining the net
    scaledTransfers = dampenTransfersToAvoidZero(scaledTransfers, startingBalance, targetSum)

    console.log("__   Dampened transfers:", scaledTransfers)
    console.log(
      "__   Verification sum:",
      scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
    )
  } else {
    console.log("__   Scaled transfers:", scaledTransfers)
    console.log(
      "__   Verification sum:",
      scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
    )
  }

  return scaledTransfers
}

/**
 * Check if a sequence of transfers causes balance to cross zero
 */
function checkIfCrossesZero(
  transfers: Array<{ logStep: number; amount: number }>,
  startingBalance: number
): boolean {
  let runningBalance = startingBalance

  for (const transfer of transfers) {
    runningBalance += transfer.amount
    if (runningBalance <= 0) {
      return true
    }
  }

  return false
}

/**
 * Dampen balance transfers to avoid crossing zero while maintaining net sum
 *
 * Strategy: Scale down intermediate swings, adjust last transfer to hit target net
 */
function dampenTransfersToAvoidZero(
  transfers: Array<{ logStep: number; amount: number }>,
  startingBalance: number,
  targetSum: number
): Array<{ logStep: number; amount: number }> {
  console.log("__     Dampening transfers to avoid zero-crossing...")

  // Try dampening factors until we find one that works
  const dampeningFactors = [0.5, 0.3, 0.1, 0.05]

  for (const dampening of dampeningFactors) {
    console.log(`__     Trying dampening factor: ${dampening}`)

    // Scale all transfers except the last one
    const dampened = transfers.slice(0, -1).map(t => ({
      logStep: t.logStep,
      amount: Math.round(t.amount * dampening)
    }))

    // Calculate what the last transfer needs to be to hit target sum
    const dampenedSum = dampened.reduce((sum, t) => sum + t.amount, 0)
    const lastTransferAmount = targetSum - dampenedSum

    const finalTransfers = [
      ...dampened,
      {
        logStep: transfers[transfers.length - 1].logStep,
        amount: lastTransferAmount
      }
    ]

    // Check if this avoids crossing zero
    if (!checkIfCrossesZero(finalTransfers, startingBalance)) {
      console.log(`__     ✓ Success with dampening factor ${dampening}`)
      return finalTransfers
    }
  }

  // If all dampening factors fail, return original scaled transfers
  // (Better to show crossing zero than break the math)
  console.warn("__     ⚠️  Could not avoid zero-crossing, using original scaled transfers")
  return transfers
}

/**
 * Validate the outcome after chain execution
 *
 * This performs critical invariant checks to ensure the system is working correctly:
 * 1. Value conservation - what rat gains/loses equals what trip loses/gains
 * 2. Trip balance math - trip balance updated correctly
 *
 * Note: Balance transfer math (sum of transfers = actual change) is guaranteed by
 * updateOutcome() and does not need to be validated here.
 *
 * @param newRat - Rat state after trip
 * @param oldTrip - Trip state before entry
 * @param newTrip - Trip state after entry
 * @param ratValueChange - Total economic value change for rat (balance + items)
 * @param tripValueChange - Balance change for trip
 */
export function validateOutcome(
  newRat: Rat,
  oldTrip: Trip,
  newTrip: Trip,
  ratValueChange: number,
  tripValueChange: number
): void {
  console.log("__ VALIDATING OUTCOME")

  const errors: string[] = []

  // * * * * * * * * * * * * * * * * * *
  // CHECK 1: Value Conservation
  // * * * * * * * * * * * * * * * * * *
  // The economic value gained by rat should equal the value lost by trip
  // This is a fundamental conservation law in the game economy
  const valueSum = ratValueChange + tripValueChange

  if (valueSum !== 0) {
    const error = `Value conservation violated: ratValueChange=${ratValueChange}, tripValueChange=${tripValueChange}, sum=${valueSum} (expected 0)`
    errors.push(error)
    console.error(`__   ❌ ${error}`)
  } else {
    console.log(`__   ✓ Value conservation: ${ratValueChange} + ${tripValueChange} = 0`)
  }

  // * * * * * * * * * * * * * * * * * *
  // CHECK 2: Trip Balance Math
  // * * * * * * * * * * * * * * * * * *
  // Trip balance should be updated by the trip value change
  const oldTripBalance = Number(oldTrip.balance ?? 0)
  const newTripBalance = Number(newTrip.balance ?? 0)
  const expectedTripBalance = oldTripBalance + tripValueChange

  if (expectedTripBalance !== newTripBalance) {
    const error = `Trip balance incorrect: oldBalance=${oldTripBalance}, valueChange=${tripValueChange}, expected=${expectedTripBalance}, actual=${newTripBalance}`
    errors.push(error)
    console.error(`__   ❌ ${error}`)
  } else {
    console.log(
      `__   ✓ Trip balance: oldBalance(${oldTripBalance}) + change(${tripValueChange}) = newBalance(${newTripBalance})`
    )
  }

  // Report to Sentry if any validation failed
  if (errors.length > 0) {
    console.error("🚨 OUTCOME VALIDATION FAILED:", {
      ratId: newRat.id,
      tripId: newTrip.id,
      totalFailures: errors.length
    })

    // Report each error separately for better Sentry grouping
    errors.forEach(errorMessage => {
      const error = new Error(`Outcome Validation Failed: ${errorMessage}`)
      captureError(error, {
        ratId: newRat.id,
        tripId: newTrip.id,
        ratValueChange,
        oldTripBalance,
        newTripBalance,
        tripValueChange,
        context: "Trip Entry - Outcome Validation"
      })
    })
  } else {
    console.log("__   ✅ All outcome validations passed")
  }
}
