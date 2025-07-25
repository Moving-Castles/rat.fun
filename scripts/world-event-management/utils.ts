import path from "path"
import fs from "fs"
import chalk from "chalk"
import { WorldEvent } from "./types"

// Utility functions
export function loadEventDefinitions(): WorldEvent[] {
  const eventDefsPath = path.join(__dirname, "event-definitions")
  const eventDefs: WorldEvent[] = []

  const eventDirs = fs
    .readdirSync(eventDefsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const eventDir of eventDirs) {
    const infoPath = path.join(eventDefsPath, eventDir, "info.json")
    if (fs.existsSync(infoPath)) {
      const eventData = JSON.parse(fs.readFileSync(infoPath, "utf8"))
      eventDefs.push(...eventData)
    }
  }

  return eventDefs
}

export function getStateColor(state: string): (text: string) => string {
  switch (state) {
    case "draft":
      return chalk.bgRed.white
    case "initialised":
      return chalk.bgYellow.black
    case "published":
      return chalk.bgBlue.white
    case "activated":
      return chalk.bgGreen.black
    default:
      return chalk.reset
  }
}

export function displayEvent(event: WorldEvent): void {
  console.log("\n" + "=".repeat(50))
  console.log(`Event ${event.index}`)
  console.log("=".repeat(50))

  const stateColor = getStateColor(event.state)
  console.log(`State: ${stateColor(event.state)}`)

  console.log(`Working Title: ${event.workingTitle}`)
  console.log(`World Address: ${event.worldAddress || "Not set"}`)
  console.log(`ID: ${event.id || "Not set"}`)

  console.log("\n--- Publication ---")
  console.log(`Title: ${event.publication.publicationTitle}`)
  console.log(`Activation Date: ${event.publication.activationDateTime}`)
  if (event.publication.publicationText) {
    console.log(`Publication Text: ${event.publication.publicationText}`)
  }

  console.log("\n--- Activation ---")
  console.log(`Title: ${event.activation.activationTitle}`)
  console.log(`Prompt: ${event.activation.prompt}`)
  console.log(`Activation Text: ${event.activation.activationText}`)
  console.log(`Duration: ${event.activation.duration} blocks`)
  if (event.activation.image) {
    console.log(`Image: ${event.activation.image}`)
  }
  console.log("=".repeat(50) + "\n")
}

export function writeEventDefinition(event: WorldEvent): void {
  const eventDir = path.join(__dirname, "event-definitions", event.index.toString())
  const infoPath = path.join(eventDir, "info.json")
  fs.writeFileSync(infoPath, JSON.stringify([event], null, 2))
}

export function isValidISODate(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && dateStr === d.toISOString()
}

/**
 * Checks required properties on an object and returns a formatted string
 * listing valid and invalid/missing required properties, with color coding.
 * @param obj The object to check
 * @param requiredProps Array of property paths (dot notation) to check
 */
export function formatRequiredPropsStatus(obj: any, requiredProps: string[]): string {
  const valid: string[] = []
  const invalid: string[] = []

  for (const prop of requiredProps) {
    // Support dot notation (e.g. 'activation.title')
    const value = prop.split(".").reduce((acc, key) => acc && acc[key], obj)
    if (value !== undefined && value !== null && value !== "") {
      valid.push(chalk.bgGreen.black(prop))
    } else {
      invalid.push(chalk.bgRed.white(prop))
    }
  }

  let result = ""
  if (valid.length) {
    result += `Valid:   ${valid.join(", ")}\n`
  }
  if (invalid.length) {
    result += `Missing: ${invalid.join(", ")}`
  }
  return result.trim()
}
