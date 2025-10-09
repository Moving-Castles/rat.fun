#!/usr/bin/env node
/* eslint-disable */

import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { ethers } from "ethers"
import fetch from "node-fetch"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Utility function for logging
function log(message: string, type: "info" | "error" | "success" = "info"): void {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: "ℹ️",
    error: "❌",
    success: "✅"
  }[type]
  console.log(`${prefix} [${timestamp}] ${message}`)
}

// Load environment variables from .env file in parent directory
try {
  const envPath = path.resolve(__dirname, "../../../.env")
  log(`Loading environment variables from ${envPath}`)
  dotenv.config({ path: envPath })
} catch (error) {
  log(
    `Failed to load .env file: ${error instanceof Error ? error.message : "Unknown error"}`,
    "error"
  )
  process.exit(1)
}

// Check if PRIVATE_KEY is set
if (!process.env.PRIVATE_KEY) {
  log("PRIVATE_KEY environment variable is not set in .env file", "error")
  process.exit(1)
}

// Constants
const MESSAGE = "RATTRIP"

// Define types
interface TripDetails {
  levelId: string
  tripPrompt: string
}

interface TripData {
  trips: TripDetails[]
}

interface CreateTripBody {
  signature: string
  tripPrompt: string
  levelId: string
}

// Parse command line arguments
const args = process.argv.slice(2)
if (args.length !== 2) {
  log("Invalid number of arguments", "error")
  log("Usage: ts-node create-trip.ts <json-file-path> <api-url>", "info")
  log("Example: ts-node create-trip.ts trip-details.json https://example.com/trip/create", "info")
  process.exit(1)
}

const jsonFilePath = args[0]
const apiUrl = args[1]

log(`Using JSON file: ${jsonFilePath}`)
log(`API URL: ${apiUrl}`)

// Read and parse the JSON file
let tripData: TripData
try {
  log("Reading JSON file...")
  const jsonContent = fs.readFileSync(jsonFilePath, "utf8")
  tripData = JSON.parse(jsonContent) as TripData

  // Validate required fields
  if (!tripData.trips || !Array.isArray(tripData.trips) || tripData.trips.length === 0) {
    log("JSON file must contain a non-empty trips array", "error")
    process.exit(1)
  }

  // Validate each trip has required fields
  for (const trip of tripData.trips) {
    if (!trip.tripPrompt) {
      log(`Trip missing required fields: ${JSON.stringify(trip)}`, "error")
      process.exit(1)
    }

    if (!trip.levelId) {
      log(`Trip missing required fields: ${JSON.stringify(trip)}`, "error")
      process.exit(1)
    }

    // Truncate tripPrompt if it's longer than 280 characters
    if (trip.tripPrompt.length > 280) {
      log(`Prompt exceeds 280 characters. Truncating...`, "info")
      trip.tripPrompt = trip.tripPrompt.substring(0, 280)
    }
  }

  log(`JSON file validated successfully. Found ${tripData.trips.length} trips.`, "success")
} catch (error) {
  if (error instanceof Error) {
    log(`Error reading JSON file: ${error.message}`, "error")
  } else {
    log("An unknown error occurred while reading the JSON file", "error")
  }
  process.exit(1)
}

// Initialize wallet
let wallet: ethers.Wallet
try {
  log("Initializing wallet...")
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY)
  log(`Wallet address: ${wallet.address}`, "success")
} catch (error) {
  log(
    `Failed to initialize wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    "error"
  )
  process.exit(1)
}

// Sign the message
async function signMessage(): Promise<string> {
  try {
    log("Signing message...")
    const signature = await wallet.signMessage(MESSAGE)
    log("Message signed successfully", "success")
    return signature
  } catch (error) {
    if (error instanceof Error) {
      log(`Error signing message: ${error.message}`, "error")
    } else {
      log("An unknown error occurred while signing the message", "error")
    }
    process.exit(1)
  }
}

// Send the request to the API for a single trip
async function sendRequest(signature: string, trip: TripDetails): Promise<void> {
  const formData: CreateTripBody = {
    signature,
    tripPrompt: trip.tripPrompt,
    levelId: trip.levelId
  }

  try {
    log(`Sending request for trip: ${trip.tripPrompt}...`)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { error: string; message: string }
      log(
        `API Error for trip ${trip.tripPrompt}: ${errorData.error}: ${errorData.message}`,
        "error"
      )
      return // Continue with other trips even if one fails
    }

    const result = await response.json()
    log(`Trip "${trip.tripPrompt}" created successfully!`, "success")
    log("Response:", "info")
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      log(`Error sending request for trip ${trip.tripPrompt}: ${error.message}`, "error")
    } else {
      log(
        `An unknown error occurred while sending the request for trip ${trip.tripPrompt}`,
        "error"
      )
    }
    // Continue with other trips even if one fails
  }
}

// Main function
async function main(): Promise<void> {
  try {
    const signature = await signMessage()

    // Process each trip sequentially
    for (const trip of tripData.trips) {
      await sendRequest(signature, trip)
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    log("All trips processed!", "success")
  } catch (error) {
    if (error instanceof Error) {
      log(`Unexpected error: ${error.message}`, "error")
    } else {
      log("An unexpected unknown error occurred", "error")
    }
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error: unknown) => {
  if (error instanceof Error) {
    log(`Unhandled promise rejection: ${error.message}`, "error")
  } else {
    log("An unhandled promise rejection occurred", "error")
  }
  process.exit(1)
})

// Run the script
main().catch((error: unknown) => {
  if (error instanceof Error) {
    log(`Fatal error: ${error.message}`, "error")
  } else {
    log("A fatal unknown error occurred", "error")
  }
  process.exit(1)
})
