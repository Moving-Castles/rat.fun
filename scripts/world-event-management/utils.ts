import path from "path"
import fs from "fs"
import { WorldEvent } from "./types"

// ANSI color codes for background colors
export const colors = {
  red: "\x1b[41m",
  yellow: "\x1b[43m",
  blue: "\x1b[44m",
  green: "\x1b[42m",
  reset: "\x1b[0m"
}

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

export function getStateColor(state: string): string {
  switch (state) {
    case "draft":
      return colors.red
    case "initialized":
      return colors.yellow
    case "announced":
      return colors.blue
    case "activated":
      return colors.green
    default:
      return colors.reset
  }
}

export function displayEvent(event: WorldEvent): void {
  console.log("\n" + "=".repeat(50))
  console.log(`Event ${event.index}`)
  console.log("=".repeat(50))

  const stateColor = getStateColor(event.state)
  console.log(`State: ${stateColor}${event.state}${colors.reset}`)

  console.log(`Working Title: ${event.workingTitle}`)
  console.log(`World Address: ${event.worldAddress || "Not set"}`)
  console.log(`ID: ${event.id || "Not set"}`)

  console.log("\n--- Announcement ---")
  console.log(`Title: ${event.announcement.announcementTitle}`)
  console.log(`Activation Date: ${event.announcement.activationDateTime}`)
  if (event.announcement.announcementText) {
    console.log(`Announcement Text: ${event.announcement.announcementText}`)
  }

  console.log("\n--- Activation ---")
  console.log(`Title: ${event.activation.publicTitle}`)
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
  const green = "\x1b[32m"
  const red = "\x1b[31m"
  const reset = "\x1b[0m"

  for (const prop of requiredProps) {
    // Support dot notation (e.g. 'activation.title')
    const value = prop.split(".").reduce((acc, key) => acc && acc[key], obj)
    if (value !== undefined && value !== null && value !== "") {
      valid.push(`${green}${prop}${reset}`)
    } else {
      invalid.push(`${red}${prop}${reset}`)
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
