import type { Trip as SanityTrip } from "@sanity-types"
import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"
import { goto } from "$app/navigation"
import { addFeedMessage } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"

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
 * Also adds the trip to the operator feed.
 */
export function handleNewTrip(trip: SanityTrip) {
  // Skip notifications on initial load
  if (!hasReceivedInitialTrips) return

  const ownerName = trip.ownerName ?? "Unknown"
  const tripTitle = trip.title || `Trip #${trip.index ?? 0}`

  // Add to operator feed
  addFeedMessage({
    id: `trip-${trip._id}-${Date.now()}`,
    type: FEED_MESSAGE_TYPE.NEW_TRIP,
    timestamp: Date.now(),
    tripId: trip._id,
    tripTitle,
    creatorName: ownerName
  })

  // Build the toast notification message
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
