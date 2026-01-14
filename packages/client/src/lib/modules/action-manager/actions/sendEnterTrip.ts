import { busy } from "../index.svelte"
import { get } from "svelte/store"
import { environment as environmentStore } from "$lib/modules/network"
import { ENVIRONMENT } from "@ratfun/common/basic-network"
import { signRequest } from "$lib/modules/signature"
import type { EnterTripRequestBody, EnterTripReturnValue } from "@server/modules/types"
import {
  PUBLIC_DEVELOPMENT_SERVER_HOST,
  PUBLIC_BASE_SEPOLIA_SERVER_HOST,
  PUBLIC_BASE_SERVER_HOST
} from "$env/static/public"
import { errorHandler } from "$lib/modules/error-handling"
import { APIError, TripError } from "@ratfun/common/error-handling"
import { createLogger } from "$lib/modules/logger"
import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"

const logger = createLogger("sendEnterTrip")

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

  let url = ""

  switch (get(environmentStore)) {
    case ENVIRONMENT.BASE_SEPOLIA:
      url = `https://${PUBLIC_BASE_SEPOLIA_SERVER_HOST}/trip/enter`
      break
    case ENVIRONMENT.BASE:
      // FOR DEBUGGING: use local server
      // url = `http://localhost:3131/trip/enter`
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
  const timeoutId = setTimeout(() => controller.abort(), 45000)

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

      // Handle trip entry lock error with a friendly message
      // This happens when user reloads or clicks again while a trip is still processing
      if (error.error === "TRIP_ENTRY_LOCK_ERROR") {
        logger.warn("Trip entry already in progress")
        toastManager.add({
          message: "Trip already in progress. Please wait for it to complete.",
          type: TOAST_TYPE.WARNING
        })
        busy.EnterTrip.set(0, { duration: 0 })
        return null
      }

      throw new APIError(`${error.error}: ${error.message}`, error)
    }

    const outcome = (await response.json()) as EnterTripReturnValue

    busy.EnterTrip.set(0, { duration: 0 })

    return outcome
  } catch (err) {
    clearTimeout(timeoutId)

    // Better error handling to distinguish between timeout and other errors
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        logger.error("Request timed out after 45 seconds")
        throw new TripError(`Request timed out - trip entry took too long`, tripId)
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        logger.error("Network error occurred:", err.message)
        throw new TripError(`Network error - please check your connection`, tripId)
      } else if (err.message.includes("Unexpected end of JSON input")) {
        logger.error("Incomplete response received:", err.message)
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
