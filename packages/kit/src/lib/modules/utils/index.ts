/**
 * ========================================
 *  utils/index.ts
 * ========================================
 * Misc. utility functions.
 */

import { Hex } from "viem"
import { BLOCKTIME } from "./constants"
import { ONE_UNIT } from "$lib/modules/ui/constants"

/**
 * Converts a string to camel case
 * @param s The string to convert
 * @returns The camel case string
 */
export function toCamelCase(s: string): string {
  return (
    s
      // Remove all underscores and hyphens and convert the following letter to uppercase
      .replace(/([-_][a-z])/gi, $1 =>
        $1.toUpperCase().replace("-", "").replace("_", "")
      )
      // Ensure the first character is in lowercase
      .replace(/^./, str => str.toLowerCase())
  )
}

/**
 * Shortens an address
 * @param s The address to shorten
 * @returns The shortened address
 */
export function shortenAddress(s: string) {
  return s ? s.slice(0, 4) + "..." + s.slice(-4) : ""
}

/**
 * Converts an address to a color
 * @param address The address to convert
 * @returns The color
 */
export function addressToColor(address: string): string {
  if (!address || address.length < 6) return "#FF0000"
  // Take the last 6 characters of the hash
  address = address.slice(-6)
  // Prefix with '#' to create a valid hex color code
  return "#" + address
}

/**
 * Gets a random integer between two numbers
 * @param min The minimum number
 * @param max The maximum number
 * @returns The random integer
 */
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Gets unique values from an array
 * @param arr The array to get unique values from
 * @returns The unique values
 */
export function getUniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Filters an object by key
 * @param obj The object to filter
 * @param keysToKeep The keys to keep
 * @returns The filtered object
 */
export function filterObjectByKey(
  obj: { [key: string]: any },
  keysToKeep: string[]
): { [key: string]: any } {
  const filteredObj: { [key: string]: any } = {}

  keysToKeep.forEach(key => {
    if (obj.hasOwnProperty(key)) {
      filteredObj[key] = obj[key]
    }
  })

  return filteredObj
}

/**
 * Removes private keys from an object
 * @param obj The object to remove private keys from
 * @returns The object with private keys removed
 */
export function removePrivateKeys(
  obj: Record<string, any>
): Record<string, any> {
  let newObj: Record<string, any> = {}
  for (const key in obj) {
    if (!key.startsWith("__")) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

/**
 * Converts an address to an id
 * @param address The address to convert
 * @returns The id
 */
export function addressToId(address: string): Hex {
  if (!address) return "0x0"
  // remove '0x' prefix, pad the address with leading zeros up to 64 characters, then add '0x' prefix back
  return ("0x" + address.slice(2).padStart(64, "0").toLowerCase()) as Hex
}

/**
 * Converts a padded address to an unpadded address
 * @param paddedAddress The padded address to convert
 * @returns The unpadded address
 */
export function idToAddress(paddedAddress: string): string {
  if (!paddedAddress) return "0x0"
  // remove '0x' prefix, remove leading zeros, then add '0x' prefix back
  return "0x" + paddedAddress.slice(2).replace(/^0+/, "")
}

/**
 * Picks a random element from an array
 * @param array The array to pick from
 * @returns The random element
 */
export function getRandomElement<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}

/**
 * Picks an element from an array by index
 * @param array The array to pick from
 * @param index The index to pick
 * @returns The element at the index
 */
export function pickByIndex<T>(array: T[], index: number): T {
  return array[array.length % (index + 1)]
}

/**
 * Converts a hex string to a string
 * @param hex The hex string to convert
 * @returns The string
 */
export function hexToString(hex: string) {
  hex = hex.substring(2) // remove the '0x' part
  let string = ""

  while (hex.length % 4 != 0) {
    // we need it to be multiple of 4
    hex = "0" + hex
  }

  for (let i = 0; i < hex.length; i += 4) {
    string += String.fromCharCode(parseInt(hex.substring(i, i + 4), 16)) // get char from ascii code which goes from 0 to 65536
  }

  return string
}

/**
 * Converts a string to a hex string
 * @param string The string to convert
 * @returns The hex string
 */
export function stringToHex(string: string) {
  let hex = ""
  for (let i = 0; i < string.length; i++) {
    hex += ((i == 0 ? "" : "000") + string.charCodeAt(i).toString(16)).slice(-4) // get character ascii code and convert to hexa string, adding necessary 0s
  }
  return "0x" + hex.toUpperCase()
}

export function stepsEasing(t: number, steps: number = 4, direction = "start") {
  // Normalize the input time.
  t = Math.min(Math.max(t, 0), 1)

  // Calculate the current step based on the direction.
  let progress
  if (direction === "start") {
    // If the direction is 'start', the change happens at the beginning of the step.
    progress = Math.floor(t * steps) / steps
  } else {
    // If the direction is 'end' (or not specified), the change happens at the end of the step.
    // Here we use `ceil` to ensure we move to the next step at the very end of the previous step.
    progress = Math.ceil(t * steps) / steps
    // This is to ensure we never exceed 1.
    progress = Math.min(progress, 1)
  }

  return progress
}

/**
 * Converts blocks to seconds
 * @param blocks The number of blocks to convert to seconds
 * @returns The number of seconds
 */
function blocksToSeconds(blocks: number) {
  return blocks * BLOCKTIME
}

/**
 * Converts blocks to a readable time string
 * @param blocks The number of blocks to convert to a readable time string
 * @returns A string in the format of "HH:MM:SS"
 */
export function blocksToReadableTime(blocks: number): string {
  const seconds = blocksToSeconds(blocks)

  // Calculate hours, minutes and seconds
  const hours: number = Math.floor(seconds / 3600)
  const minutes: number = Math.floor((seconds % 3600) / 60)
  const secs: number = seconds % 60

  // Pad minutes and seconds with leading zeros if needed
  const paddedMinutes: string = minutes < 10 ? `0${minutes}` : `${minutes}`
  const paddedSeconds: string = secs < 10 ? `0${secs}` : `${secs}`

  // Format the string
  const result: string = `${hours}:${paddedMinutes}:${paddedSeconds}`

  return result
}

/**
 * Sleeps for a given number of milliseconds
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the given number of milliseconds
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculates the time since a given timestamp
 * @param timestamp The timestamp to calculate the time since
 * @returns A string in the format of "HH:MM:SS"
 */
export function timeSince(timestamp: number): string {
  const now = Date.now() // Current time in milliseconds
  const elapsed = now - timestamp // Elapsed time in milliseconds

  // Convert milliseconds to minutes, hours, and days
  const minutes = Math.floor(elapsed / 60000)
  const hours = Math.floor(elapsed / 3600000)
  const days = Math.floor(elapsed / 86400000)

  // Return the time in the largest appropriate unit
  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""}`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`
  } else {
    return "now"
  }
}

/**
 * Calculates the modulus of two numbers
 * @param n The number to calculate the modulus of
 * @param m The modulus
 * @returns The modulus of the two numbers
 */
export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

/**
 * Scales down big ints to displayable numbers
 * @param amount The amount to scale down
 * @returns The scaled down amount
 */
export function displayAmount(amount: bigint | undefined) {
  if (amount === undefined) return 0
  if (amount === BigInt(0)) return 0
  return Number(amount / ONE_UNIT)
}

/**
 * Pads a number with zeros
 * @param value The number to pad
 * @returns The padded number
 */
export const padWithZero = (value: number) => {
  return value.toString().padStart(2, "0")
}

/**
 * Formats a date to a readable time string
 * @param date The date to format
 * @returns A string in the format of "HH:MM:SS"
 */
export function formatDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Pads a number to 78 characters
 * @param num The number to pad
 * @returns The padded number
 */
export function padToUint256(num: number | bigint): string {
  // Convert the number to a string
  const numString = num.toString()
  // Ensure the number string is padded to 78 characters
  return numString.padStart(78, "0")
}

/**
 * Generates a random uint256 number
 * @returns A random uint256 number
 */
export function getRandomUint256(): bigint {
  // Initialize a BigInt for the random uint256 value
  let randomUint256 = BigInt(0)

  // Generate 8 chunks of 32-bit random integers and combine them into a 256-bit number
  for (let i = 0; i < 8; i++) {
    // Generate a random 32-bit integer and shift it to its place in the final number
    const random32Bits = BigInt(Math.floor(Math.random() * 0x100000000))
    randomUint256 = (randomUint256 << BigInt(32)) | random32Bits
  }

  return randomUint256
}

/**
 * Generates a random uint32 number
 * @returns A random uint32 number
 */
export function getRandomUint32(): number {
  return Math.floor(Math.random() * 0x100000000)
}

/**
 * Parses JSON from a string
 * @param content The string to parse
 * @returns The parsed JSON
 */
export function parseJSONFromContent<T = Record<string, unknown>>(
  content: string
): T {
  // Regex to detect a ```json code block
  const regex = /```json([\s\S]*?)```/
  const match = content.match(regex)

  let jsonString: string

  if (match && match[1]) {
    // If a code block is found, extract its contents
    jsonString = match[1].trim()
  } else {
    // Otherwise, assume the entire content is JSON
    jsonString = content.trim()
  }

  try {
    return JSON.parse(jsonString) as T
  } catch (error: any) {
    throw new Error("Failed to parse JSON: " + error.message)
  }
}

/**
 * Truncates a string to a given length
 * @param str The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

/**
 * Replace unsafe characters with a placeholder
 * @param input The string to render
 * @param placeholder The placeholder to use if the string is unsafe
 * @param renderCodepoints Whether to render codepoints
 * @returns The rendered string
 */
export function renderSafeString(
  input: string,
  placeholder = "💀",
  renderCodepoints = false
) {
  return [...input]
    .map(char => {
      const code = char.codePointAt(0)
      if (code === undefined) return placeholder

      const isPUA =
        (code >= 0xe000 && code <= 0xf8ff) || // BMP PUA
        (code >= 0xf0000 && code <= 0xffffd) || // PUA-A
        (code >= 0x100000 && code <= 0x10fffd) // PUA-B

      const isTagsBlock = code >= 0xe0000 && code <= 0xe007f // Tags block

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
        code === 0x034f || // Combining Grapheme Joiner
        code === 0x061c || // Arabic Letter Mark
        code === 0x180e || // Mongolian Vowel Separator
        (code >= 0x1d159 && code <= 0x1d165) // Combining musical notation

      const isSuspicious =
        isPUA ||
        isTagsBlock ||
        isNonCharacter ||
        isControl ||
        isZeroWidth ||
        isObscureOrDeprecated

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

/**
 * Copies text to the clipboard
 * @param node The node to attach the event listener to
 * @param text The text to copy
 * @returns An object with a destroy method to remove the event listener
 */
export function clickToCopy(node: HTMLElement, text: string) {
  async function copyText() {
    try {
      await navigator.clipboard.writeText(text)

      node.dispatchEvent(
        new CustomEvent("copysuccess", {
          bubbles: true,
        })
      )
    } catch (error) {
      node.dispatchEvent(
        new CustomEvent("copyerror", {
          bubbles: true,
          detail: error,
        })
      )
    }
  }

  node.addEventListener("click", copyText)

  return {
    destroy() {
      node.removeEventListener("click", copyText)
    },
  }
}

/**
 * Deterministically maps an Ethereum address to a number within a specified range
 * @param address The Ethereum address to map
 * @param max The maximum number in the range (inclusive)
 * @returns A number between 0 and max
 */
export function addressToNumber(address: string, max: number): number {
  if (!address) return 0
  
  // Remove '0x' prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
  
  // Use the entire address to create a hash-like number
  // This ensures sequential addresses map to different numbers
  let hash = 0
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Make sure the number is positive and within range
  return Math.abs(hash) % (max + 1)
}

/**
 * Generates a deterministic rat image path for an Ethereum address
 * @param address The Ethereum address to map to a rat image
 * @param maxRats The maximum number of rat images available (default: 50)
 * @returns A path string in the format "/images/rats/[number].png"
 */
export function addressToRatImage(address: string, maxRats: number = 50): string {
  const ratNumber = addressToNumber(address, maxRats - 1) // -1 because we want 0-based indexing
  return `/images/rats/rat_${ratNumber}.png`
}



