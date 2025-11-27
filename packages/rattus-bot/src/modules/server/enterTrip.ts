import type { WalletClient, Chain, Transport, PrivateKeyAccount } from "viem"
import type { EnterTripRequestBody, EnterTripReturnValue } from "../../types"
import { signRequest } from "../signature"

/**
 * Call the server's /trip/enter endpoint
 */
export async function enterTrip(
  serverUrl: string,
  walletClient: WalletClient<Transport, Chain, PrivateKeyAccount>,
  tripId: string,
  ratId: string
): Promise<EnterTripReturnValue> {
  const requestBody: EnterTripRequestBody = {
    tripId,
    ratId
  }

  const signedRequest = await signRequest(requestBody, walletClient)

  const url = `${serverUrl}/trip/enter`

  // Start a ticker to show progress while waiting
  let seconds = 0
  const ticker = setInterval(() => {
    seconds++
    process.stdout.write(`\r⏳ Waiting for trip result... ${seconds}s`)
  }, 1000)

  // 45 second timeout to allow for server processing
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

    clearInterval(ticker)
    clearTimeout(timeoutId)
    process.stdout.write("\r" + " ".repeat(40) + "\r") // Clear the ticker line

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Server error: ${error.error}: ${error.message}`)
    }

    const outcome = (await response.json()) as EnterTripReturnValue
    return outcome
  } catch (err) {
    clearInterval(ticker)
    clearTimeout(timeoutId)
    process.stdout.write("\r" + " ".repeat(40) + "\r") // Clear the ticker line

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out after 45 seconds")
      }
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error(`Network error: ${err.message}`)
      }
    }

    throw err
  }
}
