import type { PendingMascotMessage, MascotMessageData } from "./types"
import {
  DEATH_MESSAGES_SEQUENTIAL,
  DEATH_MESSAGES_ROTATING,
  BIGWIN_MESSAGE,
  FIRST_CASHOUT_MESSAGE,
  ADMIN_UNLOCK_MESSAGE,
  TEST_MESSAGE
} from "./texts"

// Re-export types
export type { PendingMascotMessage, MascotMessageData } from "./types"

// Re-export store and helpers
export {
  pendingMascotMessage,
  setPendingMascotMessage,
  clearPendingMascotMessage,
  isFirstCashoutShown,
  setFirstCashoutShown,
  isAdminUnlockShown,
  setAdminUnlockShown
} from "./store"

/**
 * Get the appropriate mascot message data based on the pending message type
 */
export function getMascotMessage(pending: PendingMascotMessage): MascotMessageData {
  switch (pending.type) {
    case "death":
      return getDeathMessage(pending.deathCount)

    case "bigwin":
      return BIGWIN_MESSAGE

    case "first_cashout":
      return FIRST_CASHOUT_MESSAGE

    case "admin_unlock":
      return ADMIN_UNLOCK_MESSAGE

    case "test":
      return TEST_MESSAGE
  }
}

/**
 * Get death message based on death count
 * - Deaths 1-5: Sequential unique messages
 * - Deaths 6+: Rotating messages
 */
function getDeathMessage(deathCount: number): MascotMessageData {
  // Deaths 1-5 get unique sequential messages
  if (deathCount >= 1 && deathCount <= 5) {
    return DEATH_MESSAGES_SEQUENTIAL[deathCount - 1]
  }

  // Deaths 6+ get rotating messages based on death count
  const rotatingIndex = (deathCount - 6) % DEATH_MESSAGES_ROTATING.length
  return DEATH_MESSAGES_ROTATING[rotatingIndex]
}
