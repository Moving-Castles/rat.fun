import { get } from "svelte/store"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
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
 */
export async function sendCreateRoom(roomPrompt: string, roomCreationCost: number) {
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)
  const environment = getEnvironment()

  if (busy.CreateRoom.current !== 0) return
  busy.CreateRoom.set(0.99, { duration: DEFAULT_TIMING })

  // Approve
  try {
    if (_playerERC20Allowance < roomCreationCost) {
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
      roomCreationCost
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
      const error = await response.json()
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
