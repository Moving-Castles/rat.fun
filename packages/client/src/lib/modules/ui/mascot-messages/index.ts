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
  lastDeadRatName,
  setLastDeadRatName,
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
 * Substitute placeholders in message text with actual values
 */
function substitutePlaceholders(
  message: MascotMessageData,
  deadRatCount?: number | string,
  deadRatName?: string
): MascotMessageData {
  const countValue = deadRatCount ?? "Many"
  const nameValue = deadRatName ?? "Rat"

  return {
    text: message.text.map(unit => ({
      ...unit,
      content: unit.content
        .replace(/{DEAD_RAT_COUNT}/g, String(countValue))
        .replace(/{DEAD_RAT_NAME}/g, nameValue)
    }))
  }
}

/**
 * Get the appropriate mascot message data based on the pending message type
 */
export function getMascotMessage(pending: PendingMascotMessage): MascotMessageData {
  switch (pending.type) {
    case "new_player":
      return NEW_PLAYER_MESSAGE

    case "first_death":
      return substitutePlaceholders(FIRST_DEATH_MESSAGE, undefined, pending.deadRatName)

    case "death_trip": {
      const message = getRandomMessage(DEATH__TRIP_MESSAGES)
      return substitutePlaceholders(message, pending.deadRatCount, pending.deadRatName)
    }

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
