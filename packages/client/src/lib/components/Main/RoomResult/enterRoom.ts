/**
 * ========================================
 *  RoomResult/enterRoom.ts
 * ========================================
 * This module is responsible for makeing the API call to send a rat to a room.
 */

import type { EnterRoomReturnValue } from "@server/modules/types"
import { ENVIRONMENT } from "$lib/mud/enums"
import { getSignature } from "$lib/modules/signature"

/**
 * Makes the API call to send a rat to a room
 * @param environment The environment to enter the room in
 * @param walletNetwork The wallet network to use
 * @param roomId The ID of the room to enter
 * @param ratId The ID of the rat to enter the room with
 */
export async function enterRoom(
  environment: ENVIRONMENT,
  roomId: string,
  ratId: string
): Promise<EnterRoomReturnValue | null> {
  const startTime = performance.now()

  const url = [ENVIRONMENT.PYROPE].includes(environment)
    ? "https://reality-model-1.mc-infra.com/room/enter"
    : "http://localhost:3131/room/enter"

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

    return outcome
  } catch (err) {
    console.error(err)
    window.alert(`SERVER ERROR: ${err}`)
    return null
  }
}
