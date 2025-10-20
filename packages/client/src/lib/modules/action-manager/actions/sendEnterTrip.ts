import { busy } from "../index.svelte"
import { get } from "svelte/store"
import { environment as environmentStore } from "$lib/modules/network"
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
  if (busy.EnterTrip.current !== 0) {
    return null
  }

  busy.EnterTrip.set(0.99, { duration: DEFAULT_TIMING })

  const startTime = performance.now()

  let url = ""

  switch (get(environmentStore)) {
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

  // Set up timeout with AbortController (45 seconds to allow for server processing time)
  const controller = new AbortController()
  const timeoutId = setTimeout(controller.abort, 45000)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signedRequest),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      throw new APIError(`${error.error}: ${error.message}`, error)
    }

    const outcome = (await response.json()) as EnterTripReturnValue

    const endTime = performance.now()

    busy.EnterTrip.set(0, { duration: 0 })
    return outcome
  } catch (err) {
    clearTimeout(timeoutId)

    // Better error handling to distinguish between timeout and other errors
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error("Request timed out after 45 seconds")
        throw new TripError(`Request timed out - trip entry took too long`, tripId)
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        console.error("Network error occurred:", err.message)
        throw new TripError(`Network error - please check your connection`, tripId)
      } else if (err.message.includes("Unexpected end of JSON input")) {
        console.error("Incomplete response received:", err.message)
        throw new TripError(`Incomplete response - server may have disconnected`, tripId)
      }
    }

    errorHandler(err)
    busy.EnterTrip.set(0, { duration: 0 })
    if (!(err instanceof APIError)) {
      throw new TripError(`Failed to enter trip ${tripId}`, tripId)
    }
    return null
  }
}
