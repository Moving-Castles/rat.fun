#!/usr/bin/env node
/* eslint-disable */

import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { signMessage } from "viem/actions"
import { anvil } from "viem/chains"
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
  const envPath = path.resolve(__dirname, "../.env")
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

// Define types
interface RoomDetails {
  levelId: string
  roomPrompt: string
  roomCreationCost: number
  maxValuePerWin: number
}

interface RoomData {
  rooms: RoomDetails[]
}

interface CreateRoomBody {
  data: {
    levelId: string
    roomPrompt: string
    roomCreationCost: number
    maxValuePerWin: number
  }
  info: {
    timestamp: number
    nonce: number
    calledFrom: string | null
  }
  signature: string
}

// Parse command line arguments
const args = process.argv.slice(2)
if (args.length !== 2) {
  log("Invalid number of arguments", "error")
  log("Usage: ts-node create-room.ts <json-file-path> <api-url>", "info")
  log("Example: ts-node create-room.ts room-details.json https://example.com/room/create", "info")
  process.exit(1)
}

const jsonFilePath = args[0]
const apiUrl = args[1]

log(`Using JSON file: ${jsonFilePath}`)
log(`API URL: ${apiUrl}`)

// Read and parse the JSON file
let roomData: RoomData
try {
  log("Reading JSON file...")
  const jsonContent = fs.readFileSync(jsonFilePath, "utf8")
  roomData = JSON.parse(jsonContent) as RoomData

  // Validate required fields
  if (!roomData.rooms || !Array.isArray(roomData.rooms) || roomData.rooms.length === 0) {
    log("JSON file must contain a non-empty rooms array", "error")
    process.exit(1)
  }

  // Validate each room has required fields
  for (const room of roomData.rooms) {
    if (!room.roomPrompt) {
      log(`Room missing required fields: ${JSON.stringify(room)}`, "error")
      process.exit(1)
    }

    if (!room.levelId) {
      log(`Room missing required fields: ${JSON.stringify(room)}`, "error")
      process.exit(1)
    }

    if (!room.roomCreationCost) {
      log(`Room missing required fields: ${JSON.stringify(room)}`, "error")
      process.exit(1)
    }

    if (!room.maxValuePerWin) {
      log(`Room missing required fields: ${JSON.stringify(room)}`, "error")
      process.exit(1)
    }

    // Truncate roomPrompt if it's longer than 280 characters
    if (room.roomPrompt.length > 280) {
      log(`Prompt exceeds 280 characters. Truncating...`, "info")
      room.roomPrompt = room.roomPrompt.substring(0, 280)
    }
  }

  log(`JSON file validated successfully. Found ${roomData.rooms.length} rooms.`, "success")
} catch (error) {
  if (error instanceof Error) {
    log(`Error reading JSON file: ${error.message}`, "error")
  } else {
    log("An unknown error occurred while reading the JSON file", "error")
  }
  process.exit(1)
}

// Initialize wallet
let walletClient: any
let account: any
try {
  log("Initializing wallet...")
  console.log("PRIVATE_KEY", process.env.PRIVATE_KEY)
  account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
  walletClient = createWalletClient({
    account,
    chain: anvil,
    transport: http()
  })
  log(`Wallet address: ${account.address}`, "success")

  // Debug: Show the expected player ID
  const addressToId = (address: string): string => {
    if (!address) return "0x0"
    return "0x" + address.slice(2).padStart(64, "0").toLowerCase()
  }
  const expectedPlayerId = addressToId(account.address)
  log(`Expected player ID: ${expectedPlayerId}`, "info")
} catch (error) {
  log(
    `Failed to initialize wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
    "error"
  )
  process.exit(1)
}

// Send the request to the API for a single room
async function sendRequest(signature: string, room: RoomDetails, info: any): Promise<void> {
  const formData: CreateRoomBody = {
    data: {
      levelId: room.levelId,
      roomPrompt: room.roomPrompt,
      roomCreationCost: room.roomCreationCost,
      maxValuePerWin: room.maxValuePerWin
    },
    info,
    signature
  }

  try {
    log(`Sending request for room: ${room.roomPrompt}...`)
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
        `API Error for room ${room.roomPrompt}: ${errorData.error}: ${errorData.message}`,
        "error"
      )
      return // Continue with other rooms even if one fails
    }

    const result = await response.json()
    log(`Room "${room.roomPrompt}" created successfully!`, "success")
    log("Response:", "info")
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      log(`Error sending request for room ${room.roomPrompt}: ${error.message}`, "error")
    } else {
      log(
        `An unknown error occurred while sending the request for room ${room.roomPrompt}`,
        "error"
      )
    }
    // Continue with other rooms even if one fails
  }
}

// Main function
async function main(): Promise<void> {
  try {
    // Process each room sequentially
    for (const room of roomData.rooms) {
      // Create the message data for signing for this room
      const info = {
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1e12),
        calledFrom: null
      }
      const messageData = {
        data: {
          levelId: room.levelId,
          roomPrompt: room.roomPrompt,
          roomCreationCost: room.roomCreationCost,
          maxValuePerWin: room.maxValuePerWin
        },
        info
      }
      const messageString = JSON.stringify(messageData)
      const signature = await signMessage(walletClient, {
        account,
        message: messageString
      })
      await sendRequest(signature, room, info)
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    log("All rooms processed!", "success")
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
