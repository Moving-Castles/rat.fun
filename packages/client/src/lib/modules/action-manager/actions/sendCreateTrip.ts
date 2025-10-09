import { get } from "svelte/store"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
import { approve } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import type { CreateTripRequestBody, CreateTripReturnValue } from "@server/modules/types"
import { signRequest } from "$lib/modules/signature"
import { getEnvironment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST,
  PUBLIC_BASE_SERVER_HOST
} from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { APIError, TripError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Create trip
 * @param tripPrompt The prompt for the trip
 * @param tripCreationCost The cost of the trip
 */
export async function sendCreateTrip(tripPrompt: string, tripCreationCost: number) {
  const _externalAddressesConfig = get(externalAddressesConfig)
  const _playerERC20Allowance = get(playerERC20Allowance)
  const environment = getEnvironment()

  if (busy.CreateTrip.current !== 0) return
  busy.CreateTrip.set(0.99, { duration: DEFAULT_TIMING })

  // Approve
  try {
    if (_playerERC20Allowance < tripCreationCost) {
      await approve(_externalAddressesConfig.gamePoolAddress, BigInt(tripCreationCost))
    }

    let url = ""

    switch (environment) {
      case ENVIRONMENT.BASE_SEPOLIA:
        url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/trip/create`
        break
      case ENVIRONMENT.BASE:
        url = `https://${PUBLIC_BASE_SERVER_HOST}/trip/create`
        break
      default:
        url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/trip/create`
    }

    const requestBody: CreateTripRequestBody = {
      tripPrompt,
      tripCreationCost
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

    const result = (await response.json()) as CreateTripReturnValue
    return result
  } catch (e) {
    errorHandler(e)
    if (e instanceof APIError) {
      throw e
    }
    throw new TripError(`Failed to create trip: ${tripPrompt.substring(0, 50)}...`)
  } finally {
    busy.CreateTrip.set(0, { duration: 0 })
  }
}
