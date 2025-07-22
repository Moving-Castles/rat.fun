import { get } from "svelte/store"
import { gameConfig, playerERC20Allowance } from "$lib/modules/state/stores"
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

const DEFAULT_TIMING = 4000

/**
 * Create room
 * @param roomPrompt The prompt for the room
 * @param levelId The level ID of the room
 * @param roomCreationCost The cost of the room
 */
export async function sendCreateRoom(
  roomPrompt: string,
  levelId: string,
  roomCreationCost: bigint
) {
  const _gameConfig = get(gameConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)
  const environment = getEnvironment(new URL(window.location.href))

  if (busy.CreateRoom.current !== 0) return
  busy.CreateRoom.set(0.99, { duration: DEFAULT_TIMING })

  // Approve
  try {
    if (_playerERC20Allowance < _gameConfig.gameConfig.roomCreationCost) {
      await approve(_gameConfig.externalAddressesConfig.gamePoolAddress, roomCreationCost)
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
      levelId
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
      throw new Error(`${error.error}: ${error.message}`)
    }

    const result = (await response.json()) as CreateRoomReturnValue
    return result
  } catch (e) {
    console.error(e)
    window.alert(`SERVER ERROR: ${e}`)
    throw new Error(String(e))
  } finally {
    busy.CreateRoom.set(0, { duration: 0 })
  }
}
