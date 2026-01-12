#!/usr/bin/env node

// Load environment variables from .env file in parent directory
import * as path from "path"
import * as dotenv from "dotenv"
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { createClient } from "@sanity/client"
import { Command } from "commander"
import * as fs from "fs"

// Initialize Sanity client (using private CMS)
const client = createClient({
  projectId: process.env.PRIVATE_SANITY_CMS_ID,
  dataset: "production",
  apiVersion: "2025-04-18",
  token: process.env.PRIVATE_SANITY_CMS_TOKEN,
  useCdn: false
})

interface Outcome {
  _id: string
  _createdAt: string
  tripId: string
  tripIndex: number
  ratId: string
  ratName: string
  playerName: string
  ratValueChange: number
  oldRatBalance: number
  newRatBalance: number
  inventoryOnEntrance: string[]
  itemChanges: string[]
  itemsLostOnDeath: string[]
  tripValue: number
  log: Array<{ timestamp: string; event: string }>
  readableLog: string
  challenge?: boolean
  [key: string]: unknown
}

// Set up command line options
const program = new Command()
program
  .requiredOption("-t, --trip-id <tripId>", "Trip ID to fetch outcomes for")
  .option("-o, --output <filename>", "Output filename (default: outcomes-<tripId>.json)")
  .parse(process.argv)

const options = program.opts()
const tripId = options.tripId as string
const outputFilename = (options.output as string) || `outcomes-${tripId}.json`

async function getOutcomesForTrip() {
  try {
    console.log(`Fetching outcomes for trip: ${tripId}`)

    // Fetch all outcomes for the trip, ordered by creation timestamp
    const outcomes = await client.fetch<Outcome[]>(
      `*[_type == "outcome" && tripId == $tripId] | order(_createdAt asc) {
        ...,
        "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
      }`,
      { tripId }
    )

    console.log(`Found ${outcomes.length} outcomes`)

    if (outcomes.length === 0) {
      console.log("No outcomes found for this trip.")
      return
    }

    // Save to JSON file
    const outputPath = path.join(process.cwd(), outputFilename)
    fs.writeFileSync(outputPath, JSON.stringify(outcomes, null, 2))
    console.log(`Outcomes saved to: ${outputPath}`)

    // Print summary
    console.log("\nSummary:")
    console.log(`  Total outcomes: ${outcomes.length}`)
    console.log(`  First outcome: ${outcomes[0]._createdAt}`)
    console.log(`  Last outcome: ${outcomes[outcomes.length - 1]._createdAt}`)
  } catch (error) {
    console.error("Error fetching outcomes:", error)
    process.exit(1)
  }
}

// Check if private CMS env vars are set
if (!process.env.PRIVATE_SANITY_CMS_ID || !process.env.PRIVATE_SANITY_CMS_TOKEN) {
  console.error(
    "Error: PRIVATE_SANITY_CMS_ID or PRIVATE_SANITY_CMS_TOKEN environment variable is not set."
  )
  console.error("Please add them to your .env file in scripts/")
  process.exit(1)
}

getOutcomesForTrip()
