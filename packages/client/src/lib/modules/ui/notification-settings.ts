import { LocalStorage } from "$lib/modules/state/local.svelte"

// Store for tracking if player notifications are enabled (persisted to localStorage)
export const playerNotificationsEnabled = new LocalStorage<boolean>(
  "playerNotificationsEnabled",
  true
)

// Store for tracking if trip notifications are enabled (persisted to localStorage)
export const tripNotificationsEnabled = new LocalStorage<boolean>("tripNotificationsEnabled", true)

// Temporary override to suppress all notifications (not persisted)
// Used during game run to avoid distractions
let notificationsSuppressed = false

export function suppressNotifications() {
  notificationsSuppressed = true
}

export function unsuppressNotifications() {
  notificationsSuppressed = false
}

export function areNotificationsSuppressed() {
  return notificationsSuppressed
}
