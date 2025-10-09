import { busy } from "../index.svelte"
import { getEnvironment } from "$lib/modules/network"
import { ENVIRONMENT } from "$lib/mud/enums"
import { signRequest } from "$lib/modules/signature"
import type { EnterTripRequestBody, EnterTripReturnValue } from "@server/modules/types"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST,
  PUBLIC_BASE_SERVER_HOST
} from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { APIError, TripError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Enter trip
 * @param tripId The ID of the trip to enter
 * @param ratId The ID of the rat to enter the trip with
 */
export async function sendEnterTrip(tripId: string, ratId: string) {
  const environment = getEnvironment()

  if (busy.EnterTrip.current !== 0) {
    return null
  }

  busy.EnterTrip.set(0.99, { duration: DEFAULT_TIMING })

  const startTime = performance.now()

  let url = ""

  switch (environment) {
    case ENVIRONMENT.BASE_SEPOLIA:
      url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/trip/enter`
      break
    case ENVIRONMENT.BASE:
      url = `https://${PUBLIC_BASE_SERVER_HOST}/trip/enter`
      break
    default:
      url = `http://${PUBLIC_DEVELOPMENT_SERVER_HOST}/trip/enter`
  }

  const requestBody: EnterTripRequestBody = {
    tripId,
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

    const outcome = (await response.json()) as EnterTripReturnValue

    const endTime = performance.now()
    console.log(`Operation took ${(endTime - startTime).toFixed(3)} milliseconds`)

    busy.EnterTrip.set(0, { duration: 0 })
    return outcome
  } catch (err) {
    errorHandler(err)
    busy.EnterTrip.set(0, { duration: 0 })
    if (!(err instanceof APIError)) {
      throw new TripError(`Failed to enter trip ${tripId}`, tripId)
    }
    return null
  }
}
