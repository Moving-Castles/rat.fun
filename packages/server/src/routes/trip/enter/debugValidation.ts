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

interface ValidationResult {
  testName: string
  errorMessage: string | null
}

type ValidationTest = (context: ValidationContext) => ValidationResult

/**
 * Test 1: Check if itemChanges match between event results and validated outcome
 */
const validateItemChanges: ValidationTest = context => {
  const testName = "ItemChanges Validation"
  const match =
    JSON.stringify(context.eventResults.outcome.itemChanges) ===
    JSON.stringify(context.validatedOutcome.itemChanges)

  if (!match) {
    return {
      testName,
      errorMessage: `itemChanges mismatch: eventResults=${JSON.stringify(context.eventResults.outcome.itemChanges)}, validated=${JSON.stringify(context.validatedOutcome.itemChanges)}`
    }
  }
  return { testName, errorMessage: null }
}

/**
 * Test 2: Check if balanceTransfers match between event results and validated outcome
 */
const validateBalanceTransfers: ValidationTest = context => {
  const testName = "BalanceTransfers Validation"
  const match =
    JSON.stringify(context.eventResults.outcome.balanceTransfers) ===
    JSON.stringify(context.validatedOutcome.balanceTransfers)

  if (!match) {
    return {
      testName,
      errorMessage: `balanceTransfers mismatch: eventResults=${JSON.stringify(context.eventResults.outcome.balanceTransfers)}, validated=${JSON.stringify(context.validatedOutcome.balanceTransfers)}`
    }
  }
  return { testName, errorMessage: null }
}

/**
 * Test 3: Check that ratValueChange and tripValueChange are inverse
 */
const validateValueChangesInverse: ValidationTest = context => {
  const testName = "Value Conservation Validation"
  const sum = context.ratValueChange + context.tripValueChange

  if (sum !== 0) {
    return {
      testName,
      errorMessage: `Value changes don't match inversely: ratValueChange=${context.ratValueChange}, tripValueChange=${context.tripValueChange}, sum=${sum}`
    }
  }
  return { testName, errorMessage: null }
}

/**
 * Test 4: Check rat balance calculation
 */
const validateRatBalance: ValidationTest = context => {
  const testName = "Rat Balance Calculation"
  const expected = context.rat.balance + context.ratValueChange
  const actual = context.newRatBalance

  if (expected !== actual) {
    return {
      testName,
      errorMessage: `Rat balance calculation incorrect: oldBalance=${context.rat.balance}, valueChange=${context.ratValueChange}, expected=${expected}, actual=${actual}`
    }
  }
  return { testName, errorMessage: null }
}

/**
 * Test 5: Check trip balance calculation
 */
const validateTripBalance: ValidationTest = context => {
  const testName = "Trip Balance Calculation"
  const expected = context.trip.balance + context.tripValueChange
  const actual = context.newTripValue

  if (expected !== actual) {
    return {
      testName,
      errorMessage: `Trip balance calculation incorrect: oldBalance=${context.trip.balance}, valueChange=${context.tripValueChange}, expected=${expected}, actual=${actual}`
    }
  }
  return { testName, errorMessage: null }
}

/**
 * Test 6: Check if event logs match between original and corrected
 */
const validateEventLogs: ValidationTest = context => {
  const testName = "Event Logs Validation"
  const originalLog = context.eventResults.log
  const correctedLog = context.correctedEvents.log

  // Check if logs exist
  if (!originalLog || !correctedLog) {
    return {
      testName,
      errorMessage: `Missing logs: originalLog=${!!originalLog}, correctedLog=${!!correctedLog}`
    }
  }

  // Check if log lengths match
  if (originalLog.length !== correctedLog.length) {
    return {
      testName,
      errorMessage: `Log length mismatch: originalLog.length=${originalLog.length}, correctedLog.length=${correctedLog.length}`
    }
  }

  // Deep compare logs
  const match = JSON.stringify(originalLog) === JSON.stringify(correctedLog)

  if (!match) {
    return {
      testName,
      errorMessage: `Event logs mismatch: originalLog=${JSON.stringify(originalLog)}, correctedLog=${JSON.stringify(correctedLog)}`
    }
  }

  return { testName, errorMessage: null }
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
  if (process.env.DEBUG !== "true") {
    return
  }

  console.log("__ RUNNING DEBUG VALIDATION")

  const failedTests: ValidationResult[] = []

  // Run all validation tests
  for (const test of validationTests) {
    const result = test(context)
    if (result.errorMessage) {
      failedTests.push(result)
    }
  }

  // If any validation errors, report EACH ONE separately to Sentry
  if (failedTests.length > 0) {
    console.error("🚨 OUTCOME VALIDATION FAILED:", {
      ratId: context.ratId,
      tripId: context.tripId,
      playerId: context.playerId,
      failedTests: failedTests.map(t => t.testName),
      totalFailures: failedTests.length
    })

    // Report each validation failure as a separate error to Sentry
    // This ensures they're grouped by error type in Sentry UI
    failedTests.forEach(failure => {
      // Create error with test name prefix so Sentry groups by validation type
      const error = new Error(`${failure.testName}: ${failure.errorMessage}`)

      // Report to Sentry with unique context tag
      handleBackgroundError(error, `Trip Entry - ${failure.testName}`)

      // Log to console for immediate visibility with full details
      console.error(`  ❌ ${failure.testName}:`)
      console.error(`     ${failure.errorMessage}`)
      console.error(`     Rat: ${context.ratId}`)
      console.error(`     Trip: ${context.tripId}`)
    })

    console.error(`  Total validation failures: ${failedTests.length}`)
  } else {
    console.log("__ ✅ All debug validations passed")
  }
}
