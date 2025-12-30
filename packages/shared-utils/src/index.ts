/**
 * @ratfun/shared-utils
 * Common utility functions shared across all frontend packages.
 */

import type { Hex } from "viem"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Converts a string to camel case
 */
export function toCamelCase(s: string): string {
  return s
    .replace(/([-_][a-z])/gi, $1 => $1.toUpperCase().replace("-", "").replace("_", ""))
    .replace(/^./, str => str.toLowerCase())
}

/**
 * Truncates a string to a given length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

/**
 * Replace unsafe characters with a placeholder.
 * Used to avoid trickery with hidden/non-human readable characters.
 */
export function renderSafeString(
  input: string,
  placeholder = "\u{1F480}",
  renderCodepoints = false
): string {
  return [...input]
    .map(char => {
      const code = char.codePointAt(0)
      if (code === undefined) return placeholder

      const isPUA =
        (code >= 0xe000 && code <= 0xf8ff) ||
        (code >= 0xf0000 && code <= 0xffffd) ||
        (code >= 0x100000 && code <= 0x10fffd)

      const isTagsBlock = code >= 0xe0000 && code <= 0xe007f
      const isNonCharacter = (code & 0xfffe) === 0xfffe

      const isControl =
        (code >= 0x00 && code <= 0x1f && ![0x09, 0x0a, 0x0d].includes(code)) ||
        (code >= 0x7f && code <= 0x9f)

      const isZeroWidth =
        code === 0x200b ||
        code === 0x200c ||
        code === 0x200d ||
        code === 0x2060 ||
        code === 0xfeff ||
        (code >= 0x202a && code <= 0x202f) ||
        (code >= 0x2066 && code <= 0x2069)

      const isObscureOrDeprecated =
        code === 0x034f ||
        code === 0x061c ||
        code === 0x180e ||
        (code >= 0x1d159 && code <= 0x1d165)

      const isSuspicious =
        isPUA || isTagsBlock || isNonCharacter || isControl || isZeroWidth || isObscureOrDeprecated

      if (isSuspicious) {
        if (renderCodepoints) {
          return `[U+${code.toString(16).toUpperCase().padStart(4, "0")}]`
        } else {
          return placeholder
        }
      }

      return char
    })
    .join("")
}

// ============================================================================
// Address Utilities
// ============================================================================

/**
 * Shortens an Ethereum address for display
 */
export function shortenAddress(s: string): string {
  return s ? s.slice(0, 5) + "..." + s.slice(-5) : ""
}

/**
 * Converts an address to a hex color
 */
export function addressToColor(address: string): string {
  if (!address || address.length < 6) return "#FF0000"
  return "#" + address.slice(-6)
}

/**
 * Converts an address to a padded 32-byte id
 */
export function addressToId(address: string): Hex {
  if (!address) return "0x0"
  return ("0x" + address.slice(2).padStart(64, "0").toLowerCase()) as Hex
}

/**
 * Converts a padded id back to an unpadded address
 */
export function idToAddress(paddedAddress: string): string {
  if (!paddedAddress) return "0x0"
  return "0x" + paddedAddress.slice(2).replace(/^0+/, "")
}

/**
 * Deterministically maps an Ethereum address to a number within a specified range
 */
export function addressToNumber(address: string, max: number): number {
  if (!address) return 0

  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address

  let hash = 0
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return Math.abs(hash) % (max + 1)
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Gets unique values from an array
 */
export function getUniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Picks a random element from an array
 */
export function getRandomElement<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}

/**
 * Picks an element from an array by index (wrapping)
 */
export function pickByIndex<T>(array: T[], index: number): T {
  return array[array.length % (index + 1)]
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Filters an object by keeping only specified keys
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterObjectByKey(
  obj: { [key: string]: any },
  keysToKeep: string[]
): { [key: string]: any } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredObj: { [key: string]: any } = {}

  keysToKeep.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filteredObj[key] = obj[key]
    }
  })

  return filteredObj
}

/**
 * Removes keys starting with __ from an object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removePrivateKeys(obj: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newObj: Record<string, any> = {}
  for (const key in obj) {
    if (!key.startsWith("__")) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

// ============================================================================
// Hex Utilities
// ============================================================================

/**
 * Converts a hex string to a regular string
 */
export function hexToString(hex: string): string {
  hex = hex.substring(2)
  let string = ""

  while (hex.length % 4 != 0) {
    hex = "0" + hex
  }

  for (let i = 0; i < hex.length; i += 4) {
    string += String.fromCharCode(parseInt(hex.substring(i, i + 4), 16))
  }

  return string
}

/**
 * Converts a string to a hex string
 */
export function stringToHex(string: string): string {
  let hex = ""
  for (let i = 0; i < string.length; i++) {
    hex += ((i == 0 ? "" : "000") + string.charCodeAt(i).toString(16)).slice(-4)
  }
  return "0x" + hex.toUpperCase()
}

// ============================================================================
// Random Utilities
// ============================================================================

/**
 * Gets a random integer between two numbers (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Alias for getRandomInt
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a random uint256 number
 */
export function getRandomUint256(): bigint {
  let randomUint256 = BigInt(0)

  for (let i = 0; i < 8; i++) {
    const random32Bits = BigInt(Math.floor(Math.random() * 0x100000000))
    randomUint256 = (randomUint256 << BigInt(32)) | random32Bits
  }

  return randomUint256
}

/**
 * Generates a random uint32 number
 */
export function getRandomUint32(): number {
  return Math.floor(Math.random() * 0x100000000)
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Sleeps for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculates human-readable time since a timestamp
 */
export function timeSince(timestamp: number): string {
  const now = Date.now()
  const elapsed = now - timestamp

  const minutes = Math.floor(elapsed / 60000)
  const hours = Math.floor(elapsed / 3600000)
  const days = Math.floor(elapsed / 86400000)

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  } else {
    return "now"
  }
}

/**
 * Calculates formatted time until a timestamp
 */
export function timeUntil(timestamp: number): string {
  const now = Date.now()
  const remaining = timestamp - now

  if (remaining <= 0) {
    return "00:00:00"
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600) % 24
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const days = Math.floor(remaining / 86400000)
  const seconds = totalSeconds % 60

  const formattedDays = days.toString().padStart(2, "0")
  const formattedHours = hours.toString().padStart(2, "0")
  const formattedMinutes = minutes.toString().padStart(2, "0")
  const formattedSeconds = seconds.toString().padStart(2, "0")

  return `${formattedDays} days ${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}

/**
 * Calculates milliseconds until a timestamp
 */
export function millisUntil(timestamp: number): number {
  return timestamp - Date.now()
}

/**
 * Pads a number with a leading zero
 */
export function padWithZero(value: number): string {
  return value.toString().padStart(2, "0")
}

/**
 * Formats a date to HH:MM:SS
 */
export function formatDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

// ============================================================================
// Math Utilities
// ============================================================================

/**
 * Linear interpolation between two values
 */
export function lerp(x: number, y: number, a: number): number {
  return x * (1 - a) + y * a
}

/**
 * Clamps a value between min and max
 */
export function clamp(a: number, min: number = 0, max: number = 1): number {
  return Math.min(max, Math.max(min, a))
}

/**
 * Inverse linear interpolation - returns progress (0-1) of value between x and y
 */
export function invlerp(x: number, y: number, a: number): number {
  return clamp((a - x) / (y - x))
}

/**
 * Maps a value from one range to another
 */
export function range(x1: number, y1: number, x2: number, y2: number, a: number): number {
  return lerp(x2, y2, invlerp(x1, y1, a))
}

/**
 * Calculates the proper modulus (handles negative numbers correctly)
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/**
 * Step easing function for animations
 */
export function stepsEasing(t: number, steps: number = 4, direction = "start"): number {
  t = Math.min(Math.max(t, 0), 1)

  let progress
  if (direction === "start") {
    progress = Math.floor(t * steps) / steps
  } else {
    progress = Math.ceil(t * steps) / steps
    progress = Math.min(progress, 1)
  }

  return progress
}

/**
 * Pads a number to 78 characters (uint256 max digits)
 */
export function padToUint256(num: number | bigint): string {
  return num.toString().padStart(78, "0")
}

// ============================================================================
// Block Time Utilities
// ============================================================================

const BLOCKTIME = 2

/**
 * Converts blocks to seconds
 */
export function blocksToSeconds(blocks: number): number {
  return blocks * BLOCKTIME
}

/**
 * Converts blocks to a readable time string (H:MM:SS)
 */
export function blocksToReadableTime(blocks: number): string {
  const seconds = blocksToSeconds(blocks)

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`
  const paddedSeconds = secs < 10 ? `0${secs}` : `${secs}`

  return `${hours}:${paddedMinutes}:${paddedSeconds}`
}

// ============================================================================
// JSON Utilities
// ============================================================================

/**
 * Error class for JSON parsing failures
 */
export class JSONParseError extends Error {
  public readonly jsonString: string

  constructor(message: string, jsonString: string) {
    super(message)
    this.name = "JSONParseError"
    this.jsonString = jsonString
  }
}

/**
 * Parses JSON from a string, handling markdown code blocks
 */
export function parseJSONFromContent<T = Record<string, unknown>>(content: string): T {
  const regex = /```json([\s\S]*?)```/
  const match = content.match(regex)

  let jsonString: string

  if (match && match[1]) {
    jsonString = match[1].trim()
  } else {
    jsonString = content.trim()
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new JSONParseError("Failed to parse JSON: " + errorMessage, jsonString)
  }
}

// ============================================================================
// Browser Utilities
// ============================================================================

/**
 * Svelte action to copy text to clipboard on click
 */
export function clickToCopy(node: HTMLElement, text: string) {
  async function copyText() {
    try {
      await navigator.clipboard.writeText(text)

      node.dispatchEvent(
        new CustomEvent("copysuccess", {
          bubbles: true
        })
      )
    } catch (error) {
      node.dispatchEvent(
        new CustomEvent("copyerror", {
          bubbles: true,
          detail: error
        })
      )
    }
  }

  node.addEventListener("click", copyText)

  return {
    destroy() {
      node.removeEventListener("click", copyText)
    }
  }
}

/**
 * Detects if the current browser supports extensions (desktop browsers)
 */
export function hasExtensionSupport(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768

  if (isMobile || (isTouchDevice && isSmallScreen)) {
    return false
  }

  return true
}

// ============================================================================
// CET Timezone Utilities
// ============================================================================

const BERLIN_TZ = "Europe/Berlin"

/**
 * Calculate today's CET/CEST time (not rolling to next day).
 * Correctly handles DST transitions using date-fns-tz.
 * @param timeStr Time in HH:MM format (e.g., "16:00")
 * @returns Date object representing that time in Berlin timezone, converted to UTC
 */
export function getTodayCETTime(timeStr: string): Date {
  const now = new Date()

  // Get today's date in Berlin timezone
  const berlinNow = toZonedTime(now, BERLIN_TZ)

  // Parse the time string
  const [hours, minutes] = timeStr.padStart(5, "0").split(":").map(Number)

  // Create a date object representing the target time in Berlin
  const targetInBerlin = new Date(berlinNow)
  targetInBerlin.setHours(hours, minutes, 0, 0)

  // Convert from Berlin time to UTC - this handles DST correctly
  return fromZonedTime(targetInBerlin, BERLIN_TZ)
}

/**
 * Calculate the next occurrence of a CET/CEST time.
 * If the time has already passed today in Berlin, returns tomorrow's time.
 * Correctly handles DST transitions using date-fns-tz.
 * @param timeStr Time in HH:MM format (e.g., "16:00")
 * @returns Date object representing the next occurrence of that time in Berlin timezone
 */
export function getNextCETTime(timeStr: string): Date {
  const now = new Date()
  const todayTarget = getTodayCETTime(timeStr)

  // If the time hasn't passed yet today, return today's time
  if (todayTarget.getTime() > now.getTime()) {
    return todayTarget
  }

  // Time has passed, calculate tomorrow's time
  const berlinNow = toZonedTime(now, BERLIN_TZ)

  // Parse the time string
  const [hours, minutes] = timeStr.padStart(5, "0").split(":").map(Number)

  // Create tomorrow's date in Berlin timezone
  const tomorrowInBerlin = new Date(berlinNow)
  tomorrowInBerlin.setDate(tomorrowInBerlin.getDate() + 1)
  tomorrowInBerlin.setHours(hours, minutes, 0, 0)

  // Convert from Berlin time to UTC - this handles DST correctly
  return fromZonedTime(tomorrowInBerlin, BERLIN_TZ)
}

/**
 * Format a countdown diff (in ms) to a human-readable string
 */
export function formatCountdown(diff: number): string {
  if (diff <= 0) return ""

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`
  } else if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
  } else if (minutes > 0) {
    return `${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
  } else {
    return `${seconds.toString().padStart(2, "0")}s`
  }
}

// ============================================================================
// Blockchain Timestamp Utilities
// ============================================================================

/**
 * Converts a historical block number to an approximate timestamp.
 * Works backwards from the current block number and current time.
 * @param blockNumber The historical block number to convert
 * @param currentBlockNumber The current block number (from chain)
 * @returns The approximate timestamp in milliseconds (Unix epoch)
 */
export function blockNumberToTimestamp(blockNumber: number, currentBlockNumber: number): number {
  const currentTime = Date.now()
  const blocksDiff = currentBlockNumber - blockNumber
  const millisecondsDiff = blocksToSeconds(blocksDiff) * 1000
  return currentTime - millisecondsDiff
}

// ============================================================================
// Deterministic Hash Utilities
// ============================================================================

/**
 * Divides a 64-character hex string into 4 equal numeric parts.
 * Useful for deterministically deriving multiple values from a single hash.
 * @param hexString 64+ character hex string (with or without 0x prefix)
 * @returns Array of 4 numbers derived from each quarter of the hash
 */
export function hexToFourParts(hexString: string): [number, number, number, number] {
  // Remove 0x prefix if present
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
  const partLength = 16 // 16 hex chars = 8 bytes per part

  const part1 = parseInt(cleanHex.slice(0, partLength), 16)
  const part2 = parseInt(cleanHex.slice(partLength, partLength * 2), 16)
  const part3 = parseInt(cleanHex.slice(partLength * 2, partLength * 3), 16)
  const part4 = parseInt(cleanHex.slice(partLength * 3, partLength * 4), 16)

  return [part1, part2, part3, part4]
}

/**
 * Derives 4 deterministic indices from a hex address, useful for selecting
 * from multiple arrays based on an address hash.
 * @param addressHash A hash of the address (e.g., sha256 result)
 * @param lengths Array of 4 lengths to mod against [bodyLen, armsLen, headLen, earsLen]
 * @returns Array of 4 indices, each within bounds of the corresponding length
 */
export function hashToIndices(
  addressHash: string,
  lengths: [number, number, number, number]
): [number, number, number, number] {
  const parts = hexToFourParts(addressHash)
  return [
    parts[0] % lengths[0],
    parts[1] % lengths[1],
    parts[2] % lengths[2],
    parts[3] % lengths[3]
  ]
}
