import { handleBackgroundError } from "@modules/error-handling"
import {
  Rat,
  Trip,
  EventsReturnValue,
  OutcomeReturnValue,
  CorrectionReturnValue
} from "@modules/types"
import { Hex } from "viem"

interface ValidationContext {
  ratId: Hex
  tripId: Hex
  playerId: Hex
  rat: Rat
  trip: Trip
  eventResults: EventsReturnValue
  validatedOutcome: OutcomeReturnValue
  correctedEvents: CorrectionReturnValue
  ratValueChange: number
  tripValueChange: number
  newRatBalance: number
  newTripValue: number
}

type ValidationTest = (context: ValidationContext) => string | null

/**
 * Test 1: Check if itemChanges match between event results and validated outcome
 */
const validateItemChanges: ValidationTest = context => {
  const match =
    JSON.stringify(context.eventResults.outcome.itemChanges) ===
    JSON.stringify(context.validatedOutcome.itemChanges)

  if (!match) {
    return `itemChanges mismatch: eventResults=${JSON.stringify(context.eventResults.outcome.itemChanges)}, validated=${JSON.stringify(context.validatedOutcome.itemChanges)}`
  }
  return null
}

/**
 * Test 2: Check if balanceTransfers match between event results and validated outcome
 */
const validateBalanceTransfers: ValidationTest = context => {
  const match =
    JSON.stringify(context.eventResults.outcome.balanceTransfers) ===
    JSON.stringify(context.validatedOutcome.balanceTransfers)

  if (!match) {
    return `balanceTransfers mismatch: eventResults=${JSON.stringify(context.eventResults.outcome.balanceTransfers)}, validated=${JSON.stringify(context.validatedOutcome.balanceTransfers)}`
  }
  return null
}

/**
 * Test 3: Check that ratValueChange and tripValueChange are inverse
 */
const validateValueChangesInverse: ValidationTest = context => {
  const sum = context.ratValueChange + context.tripValueChange

  if (sum !== 0) {
    return `Value changes don't match inversely: ratValueChange=${context.ratValueChange}, tripValueChange=${context.tripValueChange}, sum=${sum}`
  }
  return null
}

/**
 * Test 4: Check rat balance calculation
 */
const validateRatBalance: ValidationTest = context => {
  const expected = context.rat.balance + context.ratValueChange
  const actual = context.newRatBalance

  if (expected !== actual) {
    return `Rat balance calculation incorrect: oldBalance=${context.rat.balance}, valueChange=${context.ratValueChange}, expected=${expected}, actual=${actual}`
  }
  return null
}

/**
 * Test 5: Check trip balance calculation
 */
const validateTripBalance: ValidationTest = context => {
  const expected = context.trip.balance + context.tripValueChange
  const actual = context.newTripValue

  if (expected !== actual) {
    return `Trip balance calculation incorrect: oldBalance=${context.trip.balance}, valueChange=${context.tripValueChange}, expected=${expected}, actual=${actual}`
  }
  return null
}

/**
 * Test 6: Check if event logs match between original and corrected
 */
const validateEventLogs: ValidationTest = context => {
  const originalLog = context.eventResults.log
  const correctedLog = context.correctedEvents.log

  // Check if logs exist
  if (!originalLog || !correctedLog) {
    return `Missing logs: originalLog=${!!originalLog}, correctedLog=${!!correctedLog}`
  }

  // Check if log lengths match
  if (originalLog.length !== correctedLog.length) {
    return `Log length mismatch: originalLog.length=${originalLog.length}, correctedLog.length=${correctedLog.length}`
  }

  // Deep compare logs
  const match = JSON.stringify(originalLog) === JSON.stringify(correctedLog)

  if (!match) {
    return `Event logs mismatch: originalLog=${JSON.stringify(originalLog)}, correctedLog=${JSON.stringify(correctedLog)}`
  }

  return null
}

/**
 * Registry of all validation tests
 * Add new tests here to extend validation
 */
const validationTests: ValidationTest[] = [
  validateItemChanges,
  validateBalanceTransfers,
  validateValueChangesInverse,
  validateRatBalance,
  validateTripBalance,
  validateEventLogs
]

/**
 * Run all debug validation tests
 * Only runs when DEBUG env var is set to "true"
 */
export function runDebugValidation(context: ValidationContext): void {
  console.log("__ RUNNING DEBUG VALIDATION")

  const validationErrors: string[] = []

  // Run all validation tests
  for (const test of validationTests) {
    const error = test(context)
    if (error) {
      validationErrors.push(error)
    }
  }

  // If any validation errors, log and send to Sentry
  if (validationErrors.length > 0) {
    const error = new Error(`Outcome validation failed: ${validationErrors.join("; ")}`)
    handleBackgroundError(error, "Trip Entry - Outcome Validation")

    // Also log to console for immediate visibility
    console.error("🚨 OUTCOME VALIDATION FAILED:", {
      ratId: context.ratId,
      tripId: context.tripId,
      playerId: context.playerId,
      errors: validationErrors,
      data: {
        eventResults: {
          itemChanges: context.eventResults.outcome.itemChanges,
          balanceTransfers: context.eventResults.outcome.balanceTransfers,
          log: context.eventResults.log
        },
        validatedOutcome: {
          itemChanges: context.validatedOutcome.itemChanges,
          balanceTransfers: context.validatedOutcome.balanceTransfers
        },
        correctedEvents: {
          log: context.correctedEvents.log
        },
        ratValueChange: context.ratValueChange.toString(),
        tripValueChange: context.tripValueChange.toString(),
        rat: { balance: context.rat.balance.toString() },
        trip: { balance: context.trip.balance.toString() },
        newRatBalance: context.newRatBalance.toString(),
        newTripValue: context.newTripValue.toString()
      }
    })
  }
}
