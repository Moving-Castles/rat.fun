import type { PendingMascotMessage, MascotMessageData } from "./types"
import {
  NEW_PLAYER_MESSAGE,
  FIRST_DEATH_MESSAGE,
  DEATH__TRIP_MESSAGES,
  DEATH__CASHOUT_MESSAGES,
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
  isNewPlayerShown,
  setNewPlayerShown,
  isFirstDeathShown,
  setFirstDeathShown,
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
    case "new_player":
      return NEW_PLAYER_MESSAGE

    case "first_death":
      return FIRST_DEATH_MESSAGE

    case "death_trip":
      return getRandomMessage(DEATH__TRIP_MESSAGES)

    case "death_cashout":
      return getRandomMessage(DEATH__CASHOUT_MESSAGES)

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
 * Get a random message from an array of messages
 */
function getRandomMessage(messages: MascotMessageData[]): MascotMessageData {
  const index = Math.floor(Math.random() * messages.length)
  return messages[index]
}
