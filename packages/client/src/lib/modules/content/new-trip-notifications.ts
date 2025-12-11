import type { Trip as SanityTrip } from "@sanity-types"
import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"
import { goto } from "$app/navigation"

let hasReceivedInitialTrips = false

/**
 * Reset the initial load flag. Call this when initializing content.
 */
export function resetNewTripNotifications() {
  hasReceivedInitialTrips = false
}

/**
 * Mark that initial trips have been received.
 * Call this after the first batch of trips is loaded.
 */
export function markInitialTripsReceived() {
  hasReceivedInitialTrips = true
}

/**
 * Handle a new trip and show a toast notification.
 * Clicking the toast navigates to the trip.
 */
export function handleNewTrip(trip: SanityTrip) {
  // Skip notifications on initial load
  if (!hasReceivedInitialTrips) return

  // Build the notification message
  const ownerName = trip.ownerName ?? "Unknown"
  const prompt = trip.prompt ?? ""
  const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt
  const message = `${ownerName} created trip: ${truncatedPrompt}`

  toastManager.add({
    message,
    type: TOAST_TYPE.NEW_TRIP_NOTIFICATION,
    onClick: () => {
      // Navigate to the trip and remove the toast
      goto(`/${trip._id}`)
    }
  })
}
