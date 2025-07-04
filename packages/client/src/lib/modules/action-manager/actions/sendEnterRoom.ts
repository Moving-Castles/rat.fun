import { busy } from "../index.svelte"
import { getEnvironment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import { getSignature } from "$lib/modules/signature"
import type { EnterRoomReturnValue } from "@server/modules/types"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_PYROPE_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST
} from "$env/static/public"

const DEFAULT_TIMING = 4000

/**
 * Enter room
 * @param roomId The ID of the room to enter
 * @param ratId The ID of the rat to enter the room with
 */
export async function sendEnterRoom(roomId: string, ratId: string) {
  const environment = getEnvironment(new URL(window.location.href))

  if (busy.EnterRoom.current !== 0) {
    return null
  }

  busy.EnterRoom.set(0.99, { duration: DEFAULT_TIMING })

  const startTime = performance.now()

  let url = ""
  switch (environment) {
    case ENVIRONMENT.PYROPE:
      url = `https://${PUBLIC_PYROPE_SERVER_HOST}/room/enter`
      break
    case ENVIRONMENT.BASE_SEPOLIA:
      url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/room/enter`
      break
    default:
      url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/room/enter`
  }

  const signature = await getSignature()

  const formData = new URLSearchParams()
  formData.append("signature", signature)
  formData.append("roomId", roomId)
  formData.append("ratId", ratId)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`${error.error}: ${error.message}`)
    }

    const outcome = (await response.json()) as EnterRoomReturnValue

    const endTime = performance.now()
    console.log(`Operation took ${(endTime - startTime).toFixed(3)} milliseconds`)

    busy.EnterRoom.set(0, { duration: 0 })
    return outcome
  } catch (err) {
    console.error(err)
    window.alert(`SERVER ERROR: ${err}`)
    busy.EnterRoom.set(0, { duration: 0 })
    return null
  }
}
