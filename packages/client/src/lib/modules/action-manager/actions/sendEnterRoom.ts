import { busy } from "../index.svelte"
import { getEnvironment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import { signRequest } from "$lib/modules/signature"
import type { EnterRoomRequestBody, EnterRoomReturnValue } from "@server/modules/types"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST,
  PUBLIC_BASE_SERVER_HOST
} from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { APIError, RoomError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Enter room
 * @param roomId The ID of the room to enter
 * @param ratId The ID of the rat to enter the room with
 */
export async function sendEnterRoom(roomId: string, ratId: string) {
  const environment = getEnvironment()

  if (busy.EnterRoom.current !== 0) {
    return null
  }

  busy.EnterRoom.set(0.99, { duration: DEFAULT_TIMING })

  const startTime = performance.now()

  let url = ""

  switch (environment) {
    case ENVIRONMENT.BASE_SEPOLIA:
      url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/room/enter`
      break
    case ENVIRONMENT.BASE:
      url = `https://${PUBLIC_BASE_SERVER_HOST}/room/enter`
      break
    default:
      url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/room/enter`
  }

  const requestBody: EnterRoomRequestBody = {
    roomId,
    ratId
  }

  const signedRequest = await signRequest(requestBody)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signedRequest)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new APIError(`${error.error}: ${error.message}`, error)
    }

    const outcome = (await response.json()) as EnterRoomReturnValue

    const endTime = performance.now()
    console.log(`Operation took ${(endTime - startTime).toFixed(3)} milliseconds`)

    busy.EnterRoom.set(0, { duration: 0 })
    return outcome
  } catch (err) {
    errorHandler(err)
    busy.EnterRoom.set(0, { duration: 0 })
    if (!(err instanceof APIError)) {
      throw new RoomError(`Failed to enter trip ${roomId}`, roomId)
    }
    return null
  }
}
