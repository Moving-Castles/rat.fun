import type { Outcome as SanityOutcome, Trip as SanityTrip } from "@sanity-types"
import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"
import {
  tripNotificationsEnabled,
  areNotificationsSuppressed
} from "$lib/modules/ui/notification-settings"
import type { Readable } from "svelte/store"
import { get } from "svelte/store"

let hasReceivedInitialOutcomes = false
let playerIdStore: Readable<string> | null = null

/**
 * Set the playerId store reference. Call this after stores are initialized.
 * This avoids circular dependency issues.
 */
export function setPlayerIdStore(store: Readable<string>) {
  playerIdStore = store
}

/**
 * Reset the initial load flag. Call this when initializing content.
 */
export function resetTripNotifications() {
  hasReceivedInitialOutcomes = false
}

/**
 * Mark that initial outcomes have been received.
 * Call this after the first batch of outcomes is loaded.
 */
export function markInitialOutcomesReceived() {
  hasReceivedInitialOutcomes = true
}

/**
 * Handle a new outcome and show a toast notification if it's for a trip
 * created by the current player (and sent by someone else).
 */
export function handleNewOutcome(outcome: SanityOutcome, trips: SanityTrip[]) {
  // Skip notifications on initial load
  if (!hasReceivedInitialOutcomes) return

  // Skip if notifications are disabled or suppressed
  if (!tripNotificationsEnabled.current || areNotificationsSuppressed()) return

  // Skip if playerId store not set
  if (!playerIdStore) return

  const currentPlayerId = get(playerIdStore)

  // Find the trip this outcome belongs to
  const trip = trips.find(t => t._id === outcome.tripId)
  if (!trip) return

  // Only notify if this is MY trip
  if (trip.owner !== currentPlayerId) return

  // Don't notify if I sent the rat myself
  if (outcome.playerId === currentPlayerId) return

  // Build the notification message
  const message = buildTripNotificationMessage(outcome)

  toastManager.add({
    message,
    type: TOAST_TYPE.TRIP_NOTIFICATION
  })
}

/**
 * Build the notification message based on the outcome.
 */
function buildTripNotificationMessage(outcome: SanityOutcome): string {
  const playerName = outcome.playerName ?? "Unknown"
  const ratName = outcome.ratName ?? "Unknown"
  const tripIndex = outcome.tripIndex ?? 0
  const tripValueChange = outcome.tripValueChange ?? 0
  const ratDied = outcome.ratValue === 0

  const gainedOrLost = tripValueChange >= 0 ? "gained" : "lost"
  const absValue = Math.abs(tripValueChange)

  if (ratDied) {
    return `${playerName} let ${ratName} die in trip ${tripIndex}: you ${gainedOrLost} ${absValue} $RAT`
  }

  return `${playerName} sent ${ratName} to trip ${tripIndex}: you ${gainedOrLost} ${absValue} $RAT`
}
