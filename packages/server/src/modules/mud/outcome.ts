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
import {
  OutcomeUpdateError,
  BalanceTransferMismatchError,
  ValueConservationError,
  TripBalanceCalculationError,
  handleBackgroundError
} from "@modules/error-handling"
import { isValidBytes32 } from "@modules/utils"
import { TripLogger } from "@modules/logging"

/**
 * Parse the LLM outcome into the arguments for the smart contract's applyOutcome function
 *
 * The LLM returns a rich outcome with multiple balance transfers (step-by-step) and item changes.
 * The smart contract expects a simpler format with a single net balance transfer value.
 *
 * @param rat - The rat entering the trip
 * @param trip - The trip being entered
 * @param outcome - The outcome suggested by the LLM
 * @param logger - Logger for accumulating trip logs
 * @returns Arguments formatted for the applyOutcome contract call: [ratId, tripId, balanceTransfer, itemsToRemove, itemsToAdd]
 */
export function createOutcomeCallArgs(
  rat: Rat,
  trip: Trip,
  outcome: OutcomeReturnValue,
  logger: TripLogger
) {
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.log("📦 createOutcomeCallArgs - Formatting LLM outcome for contract")
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.log("Rat ID:", rat.id)
  logger.log("Trip ID:", trip.id)
  logger.log("Rat current balance:", rat.balance)
  logger.log("Trip current balance:", trip.balance)

  // * * * * * * * * * * * * * * * * * *
  // BALANCE TRANSFERS
  // * * * * * * * * * * * * * * * * * *
  // The LLM provides step-by-step balance transfers (e.g., step 1: -50, step 2: +100)
  // The smart contract needs the NET value (sum of all transfers)
  // Positive value = Trip gives to Rat (limited by trip budget)
  // Negative value = Rat gives to Trip (limited by rat balance)

  logger.log("\n📊 BALANCE TRANSFERS:")

  const balanceTransfersLLM = outcome.balanceTransfers

  if (balanceTransfersLLM.length === 0) {
    logger.log("  ℹ️  No balance transfers from LLM")
  } else {
    logger.log(`  LLM provided ${balanceTransfersLLM.length} transfer(s)`)
    balanceTransfersLLM.forEach(transfer => {
      logger.log(`    logStep:${transfer.logStep}, amount:${transfer.amount}`)
    })
  }

  const balanceTransfersSum = balanceTransfersLLM.reduce((acc, curr) => acc + curr.amount, 0)

  logger.log(`  ✅ Final sum: ${balanceTransfersSum}`)
  logger.log(`  Converting to BigInt: ${BigInt(balanceTransfersSum)}`)

  // * * * * * * * * * * * * * * * * * *
  // ITEMS TO REMOVE
  // * * * * * * * * * * * * * * * * * *
  // Extract IDs of items the LLM wants to remove from rat's inventory
  // These items' values will be transferred back to the trip
  // IMPORTANT: Validate all IDs - LLM sometimes provides invalid/missing IDs

  logger.log("\n🗑️  ITEMS TO REMOVE:")
  const itemsToRemoveLLM = outcome.itemChanges.filter(c => c.type === "remove")

  const itemsToRemoveFromRat: Hex[] = []
  const invalidRemovals: Array<{ name: string; id: any }> = []

  if (itemsToRemoveLLM.length === 0) {
    logger.log("  ℹ️  No items to remove")
  } else {
    logger.log(`  LLM requested ${itemsToRemoveLLM.length} item(s) to remove`)

    itemsToRemoveLLM.forEach(item => {
      if (isValidBytes32(item.id)) {
        itemsToRemoveFromRat.push(item.id)
        logger.log(`    [✓] ${item.id} - ${item.name} (value: ${item.value})`)
      } else {
        invalidRemovals.push({ name: item.name, id: item.id })
        logger.log(`    [✗] Invalid ID for "${item.name}": ${JSON.stringify(item.id)} - SKIPPED`)
      }
    })

    if (invalidRemovals.length > 0) {
      logger.log(`  ⚠️  Skipped ${invalidRemovals.length} invalid removal(s):`)
      invalidRemovals.forEach(({ name, id }) => {
        logger.log(`      - ${name}: ID was ${JSON.stringify(id)}`)
      })
      logger.log(
        "  ⚠️  Common causes: LLM trying to remove items added in same trip, or providing invalid IDs"
      )
    }
  }

  // Calculate total value of items being removed (these will refund to trip)
  const totalItemValueToRemove = itemsToRemoveLLM
    .filter(item => isValidBytes32(item.id))
    .reduce((sum, item) => sum + item.value, 0)
  logger.log(`  💰 Total value to refund to trip: ${totalItemValueToRemove}`)

  // * * * * * * * * * * * * * * * * * *
  // ITEMS TO ADD
  // * * * * * * * * * * * * * * * * * *
  // Format items the LLM wants to add to rat's inventory
  // Contract expects: { name: string, value: bigint }
  // Constraints applied by contract:
  // - Max 6 items in inventory
  // - Trip must have budget to cover item value
  // - Item names limited to 48 characters

  logger.log("\n➕ ITEMS TO ADD:")
  const itemsToAddToRat = outcome.itemChanges
    .filter(c => c.type === "add")
    .map(c => ({
      name: c.name.slice(0, 48), // Enforce name length limit
      value: BigInt(Math.abs(c.value)) // Item values are always positive
    }))

  if (itemsToAddToRat.length === 0) {
    logger.log("  ℹ️  No items to add")
  } else {
    logger.log(`  Found ${itemsToAddToRat.length} item(s) to add:`)
    itemsToAddToRat.forEach((item, index) => {
      logger.log(`    [${index}] ${item.name} (value: ${item.value})`)
    })
  }

  // Calculate total value of items being added (these will cost trip budget)
  const totalItemValueToAdd = itemsToAddToRat.reduce((sum, item) => sum + Number(item.value), 0)
  logger.log(`  💰 Total value to deduct from trip: ${totalItemValueToAdd}`)

  // Return arguments in the format expected by ManagerSystem.applyOutcome()
  const contractArgs = [
    rat.id,
    trip.id,
    BigInt(balanceTransfersSum),
    itemsToRemoveFromRat,
    itemsToAddToRat
  ] as [Hex, Hex, bigint, Hex[], { name: string; value: bigint }[]]

  logger.log("\n📤 FINAL CONTRACT ARGUMENTS:")
  logger.log("  ratId:", contractArgs[0])
  logger.log("  tripId:", contractArgs[1])
  logger.log("  balanceTransfer (bigint):", contractArgs[2], `← from sum of ${balanceTransfersSum}`)
  logger.log("  itemsToRemove:", contractArgs[3].length, "items")
  logger.log("  itemsToAdd:", contractArgs[4].length, "items")
  logger.log("\n💡 PREDICTED NET EFFECT:")
  logger.log(
    "  Rat balance change (before constraints):",
    balanceTransfersSum - totalItemValueToRemove + totalItemValueToAdd
  )
  logger.log(
    "  Trip balance change (before constraints):",
    -(balanceTransfersSum + totalItemValueToAdd - totalItemValueToRemove)
  )
  logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

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
 * @param logger - Logger for accumulating trip logs
 * @returns The validated outcome reflecting what actually happened on-chain
 */
export function updateOutcome(
  llmOutcome: OutcomeReturnValue,
  oldRat: Rat,
  newRat: Rat,
  logger: TripLogger,
  newTrip?: Trip,
  outcomeId?: string
): OutcomeReturnValue {
  // Deep clone the LLM outcome to avoid mutating the original
  const newOutcome = JSON.parse(JSON.stringify(llmOutcome)) as OutcomeReturnValue
  newOutcome.itemsLostOnDeath = []

  // * * * * * * * * * * * * * * * * * *
  // Defensive null checks and array safety
  // * * * * * * * * * * * * * * * * * *
  if (!oldRat || !newRat) {
    throw new OutcomeUpdateError("Missing rat data: oldRat or newRat is null/undefined", {
      hasOldRat: !!oldRat,
      hasNewRat: !!newRat
    })
  }

  // Type validation - ensure balance fields are numbers (not undefined/null/bigint/string)
  const oldBalance = Number(oldRat.balance ?? 0)
  const newBalance = Number(newRat.balance ?? 0)
  const oldInventory = Array.isArray(oldRat.inventory) ? oldRat.inventory : []
  const newInventory = Array.isArray(newRat.inventory) ? newRat.inventory : []

  logger.log("__ updateOutcome: Reconciling LLM suggestions with on-chain reality")
  logger.log("__ Rat ID:", newRat.id)
  logger.log("__ oldRat balance:", oldBalance, "inventory:", oldInventory.length)
  logger.log("__ newRat balance:", newBalance, "inventory:", newInventory.length)
  logger.log("__ LLM suggested balanceTransfers:", llmOutcome.balanceTransfers)

  // Detect rat death early
  // If rat died (balance = 0), special handling:
  // - Contract transfers item VALUES to trip (for accounting)
  // - But items stay in dead rat's inventory (to save gas)
  // - Contract returns early, skipping further item processing
  const ratDied = newBalance === 0 && oldBalance > 0

  if (ratDied) {
    logger.log("⚠️  RAT DIED during trip - Special death handling:")
    logger.log("__ - Rat balance → 0")
    logger.log("__ - Item VALUES transferred to trip")
    logger.log("__ - Items stay in dead rat inventory (gas optimization)")
    logger.log("__ - Contract aborted further item processing")

    // Calculate total value of items that stayed with dead rat
    const deadRatItemValue = oldInventory.reduce((sum, item) => sum + (item.value ?? 0), 0)
    logger.log(`__ - Total item value transferred: ${deadRatItemValue}`)
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

  // Log inventory states for debugging
  logger.log("__ Comparing inventories to detect item changes:")
  logger.log(
    `__   Old inventory (${oldInventory.length} items):`,
    oldInventory.map(i => `${i.name} (${i.id})`).join(", ") || "none"
  )
  logger.log(
    `__   New inventory (${newInventory.length} items):`,
    newInventory.map(i => `${i.name} (${i.id})`).join(", ") || "none"
  )

  if (ratDied) {
    // On death, items stay in inventory but we don't process new item changes
    // The client doesn't need to see items "removed" because they physically stayed
    // However, we record the items lost for the sanity outcome document
    logger.log("__ Skipping item change detection - rat died, items frozen")
    logger.log("__ Recording items lost on death for outcome document:")
    for (const item of oldInventory) {
      logger.log(`__   - ${item.name} (value: ${item.value}, id: ${item.id})`)
      newOutcome.itemsLostOnDeath.push({
        name: item.name,
        value: item.value ?? 0,
        id: item.id
      })
    }
    if (oldInventory.length === 0) {
      logger.log("__   (no items in inventory)")
    }
  } else {
    // Normal case: compare inventories to detect actual changes

    // Find items that were ADDED (exist in new but not in old)
    logger.log("__ Checking for added items...")
    for (let i = 0; i < newInventory.length; i++) {
      const itemInNewRat = newInventory[i]
      const existedBefore = oldInventory.find(item => item.id === itemInNewRat.id)

      if (!existedBefore) {
        // This item was added by the contract
        const logStep = getLogStep(itemInNewRat.name, llmOutcome.itemChanges)
        logger.log(`__   ✓ Detected ADDITION: ${itemInNewRat.name} (ID: ${itemInNewRat.id})`)
        newOutcome.itemChanges.push({
          logStep,
          type: "add",
          name: itemInNewRat.name,
          value: itemInNewRat.value,
          id: itemInNewRat.id
        })
      } else {
        logger.log(`__   - Item already existed: ${itemInNewRat.name} (ID: ${itemInNewRat.id})`)
      }
    }

    // Find items that were REMOVED (exist in old but not in new)
    logger.log("__ Checking for removed items...")
    for (let i = 0; i < oldInventory.length; i++) {
      const itemInOldRat = oldInventory[i]
      const stillExists = newInventory.find(item => item.id === itemInOldRat.id)

      if (!stillExists) {
        // This item was removed by the contract
        const logStep = getLogStep(itemInOldRat.name, llmOutcome.itemChanges)
        logger.log(`__   ✓ Detected REMOVAL: ${itemInOldRat.name} (ID: ${itemInOldRat.id})`)
        newOutcome.itemChanges.push({
          logStep,
          type: "remove",
          name: itemInOldRat.name,
          value: itemInOldRat.value,
          id: itemInOldRat.id
        })
      } else {
        logger.log(`__   - Item still exists: ${itemInOldRat.name} (ID: ${itemInOldRat.id})`)
      }
    }
  }

  // Log actual item changes that occurred
  if (newOutcome.itemChanges.length > 0) {
    logger.log("__ ✓ Actual item changes applied by contract:")
    newOutcome.itemChanges.forEach(change => {
      logger.log(
        `__   - ${change.type}: ${change.name} (value: ${change.value}, logStep: ${change.logStep})`
      )
    })
  } else {
    logger.log("__ No item changes occurred (may have been rejected by contract)")
  }

  // Check if LLM suggested items but none were applied
  const llmSuggestedItems = llmOutcome.itemChanges.length > 0
  if (llmSuggestedItems && newOutcome.itemChanges.length === 0) {
    logger.log("⚠️  LLM suggested item changes, but NONE were applied by contract")
    logger.log("__ Possible reasons: inventory full, insufficient budget, or rat died")
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
  if (llmOutcome.balanceTransfers.length === 0) {
    logger.log("__ No balance transfers suggested by LLM")
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
    logger.log(
      `__ Death note: ${implicitItemValueTransfer} in item values will be transferred to trip (separate from balance)`
    )
  }

  logger.log("__ Balance validation:")
  logger.log("__   LLM expected balance change:", expectedBalanceChange)
  logger.log("__   Actual balance change:", actualBalanceChange)
  if (ratDied && implicitItemValueTransfer > 0) {
    logger.log(
      `__   (Plus ${implicitItemValueTransfer} in item values - tracked separately, not in balanceTransfers)`
    )
  }

  // * * * * * * * * * * * * * * * * * *
  // CASE 1: Expected matches actual - everything worked as planned
  // * * * * * * * * * * * * * * * * * *
  // Compare BALANCE changes only (not including item value transfers)
  const balanceMatches = expectedBalanceChange === actualBalanceChange

  if (balanceMatches) {
    logger.log("__ ✓ Balance transfer successful - LLM intent matched on-chain execution")
    if (ratDied && implicitItemValueTransfer > 0) {
      logger.log(
        `__   (Note: ${implicitItemValueTransfer} in item values transferred separately on death)`
      )
    }

    // Even when balance matches, check if the step-by-step sequence crosses zero
    // This prevents UI from showing temporary death states
    const finalBalance = oldBalance + actualBalanceChange
    const crossesZero = checkIfCrossesZero(llmOutcome.balanceTransfers, oldBalance)

    if (crossesZero && finalBalance > 0) {
      logger.log(
        "__   ⚠️  Sequence crosses zero (temporary death) even though net is correct - Dampening"
      )
      const dampenedTransfers = dampenTransfersToAvoidZero(
        llmOutcome.balanceTransfers,
        oldBalance,
        actualBalanceChange,
        logger
      )
      newOutcome.balanceTransfers = dampenedTransfers
      logger.log("__   Dampened transfers:", dampenedTransfers)
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

  // Report mismatch (logs to console and Sentry)
  const errorMessage = isSignFlip
    ? `LLM expected ${expectedBalanceChange > 0 ? "gain" : "loss"} of ${Math.abs(expectedBalanceChange)}, contract did ${actualBalanceChange > 0 ? "gain" : "loss"} of ${Math.abs(actualBalanceChange)}`
    : `LLM expected ${expectedBalanceChange}, contract did ${actualBalanceChange}`

  const mismatchError = new BalanceTransferMismatchError(
    errorMessage,
    expectedBalanceChange,
    actualBalanceChange,
    newRat.id,
    isSignFlip,
    {
      scaleFactor,
      oldBalance,
      newBalance,
      ratDied,
      implicitItemValueTransfer: ratDied ? implicitItemValueTransfer : 0,
      suggestedTransfers: llmOutcome.balanceTransfers
    }
  )

  handleBackgroundError(mismatchError, "Trip Entry - Balance Transfer Mismatch", {
    ...(outcomeId && { outcomeId }),
    ratId: newRat.id,
    ...(newTrip?.id && { tripId: newTrip.id })
  })

  // Scale transfers proportionally to match the actual BALANCE outcome
  // balanceTransfers represents ONLY balance/health changes (what the UI displays)
  // Item value transfers on death are tracked separately via getRatValue/getTripValue
  logger.log("__ Scaling balance transfers to match actual balance change:", actualBalanceChange)
  if (ratDied && implicitItemValueTransfer > 0) {
    logger.log(
      `__   (Item values of ${implicitItemValueTransfer} handled separately - not in balanceTransfers)`
    )
  }

  const scaledTransfers = scaleBalanceTransfers(
    llmOutcome.balanceTransfers,
    actualBalanceChange,
    oldBalance,
    logger
  )

  newOutcome.balanceTransfers = scaledTransfers

  logger.log("__ ✓ Scaled transfers preserve narrative structure for correction LLM")

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
  startingBalance: number,
  logger: TripLogger
): Array<{ logStep: number; amount: number }> {
  if (transfers.length === 0) {
    return []
  }

  logger.log("__ Scaling balance transfers to match actual on-chain outcome")
  logger.log("__   Starting balance:", startingBalance)
  logger.log("__   Original transfers:", transfers)
  logger.log("__   Target sum:", targetSum)

  // Edge case: Single transfer - just use the actual value
  if (transfers.length === 1) {
    const originalAmount = transfers[0].amount
    const signFlipped =
      Math.sign(originalAmount) !== Math.sign(targetSum) && originalAmount !== 0 && targetSum !== 0

    if (signFlipped) {
      logger.log(
        "__   ⚠️  SIGN FLIP: Single transfer changed from",
        originalAmount,
        "to",
        targetSum
      )
    } else {
      logger.log("__   Single transfer: using actual value directly")
    }

    return [{ logStep: transfers[0].logStep, amount: targetSum }]
  }

  // Calculate scale factor
  const originalSum = transfers.reduce((sum, t) => sum + t.amount, 0)
  const scaleFactor = originalSum === 0 ? 1 : targetSum / originalSum

  logger.log(`__   Scale factor: ${targetSum} / ${originalSum} = ${scaleFactor}`)

  // Warn about sign flips
  if (scaleFactor < 0) {
    logger.log("__   🚨 SIGN FLIP: Negative scale factor means ALL transfers reversed direction!")
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
    logger.log(`__   Rounding error: ${roundingError}`)
    const largestIndex = scaledTransfers.reduce(
      (maxIdx, transfer, idx, arr) =>
        Math.abs(transfer.amount) > Math.abs(arr[maxIdx].amount) ? idx : maxIdx,
      0
    )
    scaledTransfers[largestIndex].amount += roundingError
    logger.log(`__   Adjusted transfer [${largestIndex}] by ${roundingError}`)
  }

  // Check if transfers cross zero during progression (rat "dies" then recovers)
  // This creates awkward UI where health bar shows death → resurrection
  const finalBalance = startingBalance + targetSum
  const crossesZero = checkIfCrossesZero(scaledTransfers, startingBalance)

  if (crossesZero && finalBalance > 0) {
    logger.log("__   ⚠️  TRANSFERS CROSS ZERO (temporary death) - Dampening to avoid UI confusion")

    // Dampen the swings while maintaining the net
    scaledTransfers = dampenTransfersToAvoidZero(
      scaledTransfers,
      startingBalance,
      targetSum,
      logger
    )

    logger.log("__   Dampened transfers:", scaledTransfers)
    logger.log(
      "__   Verification sum:",
      scaledTransfers.reduce((sum, t) => sum + t.amount, 0)
    )
  } else {
    logger.log("__   Scaled transfers:", scaledTransfers)
    logger.log(
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
  targetSum: number,
  logger: TripLogger
): Array<{ logStep: number; amount: number }> {
  logger.log("__     Dampening transfers to avoid zero-crossing...")

  // Try dampening factors until we find one that works
  const dampeningFactors = [0.5, 0.3, 0.1, 0.05]

  for (const dampening of dampeningFactors) {
    logger.log(`__     Trying dampening factor: ${dampening}`)

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
      logger.log(`__     ✓ Success with dampening factor ${dampening}`)
      return finalTransfers
    }
  }

  // If all dampening factors fail, return original scaled transfers
  // (Better to show crossing zero than break the math)
  logger.log("__     ⚠️  Could not avoid zero-crossing, using original scaled transfers")
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
 * @param logger - Logger for accumulating trip logs
 */
export function validateOutcome(
  newRat: Rat,
  oldTrip: Trip,
  newTrip: Trip,
  ratValueChange: number,
  tripValueChange: number,
  logger: TripLogger,
  outcomeId?: string
): void {
  logger.log("__ VALIDATING OUTCOME")

  // * * * * * * * * * * * * * * * * * *
  // CHECK 1: Value Conservation
  // * * * * * * * * * * * * * * * * * *
  // The economic value gained by rat should equal the value lost by trip
  // This is a fundamental conservation law in the game economy
  const valueSum = ratValueChange + tripValueChange

  if (valueSum !== 0) {
    const error = new ValueConservationError(ratValueChange, tripValueChange, newRat.id, newTrip.id)
    handleBackgroundError(error, "Trip Entry - Value Conservation", {
      ...(outcomeId && { outcomeId }),
      ratId: newRat.id,
      tripId: newTrip.id
    })
  } else {
    logger.log(`__   ✓ Value conservation: ${ratValueChange} + ${tripValueChange} = 0`)
  }

  // * * * * * * * * * * * * * * * * * *
  // CHECK 2: Trip Balance Math
  // * * * * * * * * * * * * * * * * * *
  // Trip balance should be updated by the trip value change
  const oldTripBalance = Number(oldTrip.balance ?? 0)
  const newTripBalance = Number(newTrip.balance ?? 0)
  const expectedTripBalance = oldTripBalance + tripValueChange

  if (expectedTripBalance !== newTripBalance) {
    const error = new TripBalanceCalculationError(
      oldTripBalance,
      tripValueChange,
      expectedTripBalance,
      newTripBalance,
      newRat.id,
      newTrip.id
    )
    handleBackgroundError(error, "Trip Entry - Trip Balance", {
      ...(outcomeId && { outcomeId }),
      ratId: newRat.id,
      tripId: newTrip.id
    })
  } else {
    logger.log(
      `__   ✓ Trip balance: oldBalance(${oldTripBalance}) + change(${tripValueChange}) = newBalance(${newTripBalance})`
    )
  }

  // Log success if no errors occurred
  if (valueSum === 0 && expectedTripBalance === newTripBalance) {
    logger.log("__   ✅ All outcome validations passed")
  }
}
