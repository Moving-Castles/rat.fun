import { readFileSync, writeFileSync, existsSync } from "fs"
import type { TripOutcomeHistory } from "../../types"

const HISTORY_FILE = "outcome-history.json"

/**
 * Load outcome history from JSON file
 */
export function loadOutcomeHistory(): TripOutcomeHistory[] {
  try {
    if (existsSync(HISTORY_FILE)) {
      const data = readFileSync(HISTORY_FILE, "utf-8")
      const history = JSON.parse(data) as TripOutcomeHistory[]
      console.log(`Loaded ${history.length} previous outcomes from ${HISTORY_FILE}`)
      return history
    }
  } catch (error) {
    console.warn(
      `Failed to load outcome history: ${error instanceof Error ? error.message : error}`
    )
  }
  return []
}

/**
 * Save outcome history to JSON file
 */
export function saveOutcomeHistory(history: TripOutcomeHistory[]): void {
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch (error) {
    console.warn(
      `Failed to save outcome history: ${error instanceof Error ? error.message : error}`
    )
  }
}
