import { get } from "svelte/store"

import {
  gameConfig,
  externalAddressesConfig,
  playerERC20Allowance
} from "$lib/modules/state/stores"
import { approve } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import type { CreateRoomRequestBody, CreateRoomReturnValue } from "@server/modules/types"
import { signRequest } from "$lib/modules/signature"
import { getEnvironment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST,
  PUBLIC_BASE_SERVER_HOST
} from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { APIError, RoomError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Create room
 * @param roomPrompt The prompt for the room
 * @param roomCreationCost The cost of the room
 * @param maxValuePerWin The max value per win for the room
 * @param minRatValueToEnter The min value to enter for the room
 */
export async function sendCreateRoom(
  roomPrompt: string,
  roomCreationCost: number,
  maxValuePerWin: number,
  minRatValueToEnter: number
) {
  const _gameConfig = get(gameConfig)
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)
  const environment = getEnvironment()

  if (busy.CreateRoom.current !== 0) return
  busy.CreateRoom.set(0.99, { duration: DEFAULT_TIMING })

  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.roomCreationCost) {
      await approve(_externalAddressesConfig.gamePoolAddress, BigInt(roomCreationCost))
    }

    let url = ""

    switch (environment) {
      case ENVIRONMENT.BASE_SEPOLIA:
        url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/room/create`
        break
      case ENVIRONMENT.BASE:
        url = `https://${PUBLIC_BASE_SERVER_HOST}/room/create`
        break
      default:
        url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/room/create`
    }

    const requestBody: CreateRoomRequestBody = {
      roomPrompt,
      roomCreationCost,
      maxValuePerWin,
      minRatValueToEnter
    }

    const signedRequest = await signRequest(requestBody)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signedRequest)
    })

    if (!response.ok) {
      console.log("response", response)
      const error = await response.json()
      console.log("error", error)
      throw new APIError(`${error.error}: ${error.message}`, error)
    }

    const result = (await response.json()) as CreateRoomReturnValue
    return result
  } catch (e) {
    errorHandler(e)
    if (e instanceof APIError) {
      throw e
    }
    throw new RoomError(`Failed to create trip: ${roomPrompt.substring(0, 50)}...`)
  } finally {
    busy.CreateRoom.set(0, { duration: 0 })
  }
}
