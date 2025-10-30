import { get } from "svelte/store"
import { playerId } from "$lib/modules/state/stores"
import { environment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import { PUBLIC_DEVELOPMENT_SERVER_HOST } from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { adminUnlockedAt } from "$lib/modules/ui/state.svelte"

/**
 * Unlock admin/cashboard privileges for the current player
 * Only works in local development (CHAIN_ID === 31337)
 */
export async function sendUnlockAdmin() {
  try {
    // Only works in local development
    if (get(environment) !== ENVIRONMENT.DEVELOPMENT) {
      console.warn("Admin unlock is only available in local development")
      return
    }

    const currentPlayerId = get(playerId)
    if (!currentPlayerId) {
      console.error("No player ID available")
      return
    }

    const url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/dev/unlock-admin`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: currentPlayerId })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Failed to unlock admin:", error)
      return
    }

    adminUnlockedAt.set(Date.now())
    // console.log("Admin privileges granted")
  } catch (e) {
    errorHandler(e)
  }
}
