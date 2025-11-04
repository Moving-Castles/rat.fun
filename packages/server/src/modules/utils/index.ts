import { Hex } from "viem"

export function generateRandomBytes32(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return ("0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")) as Hex
}

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function pickRandomMultiple<T>(array: T[], count: number): T[] {
  return array.sort(() => Math.random() - 0.5).slice(0, count)
}

/**
 * Retries any function until it returns a truthy result or times out
 * @param fn The function to retry
 * @param timeoutMs Maximum time to wait in milliseconds (default: 5000)
 * @param retryIntervalMs Interval between retries in milliseconds (default: 100)
 * @param condition Optional function to check if the result is valid (default: checks for truthy)
 * @returns The function result or null if timeout
 */
export async function retryUntilResult<T>(
  fn: () => T | undefined | null,
  timeoutMs: number = 5000,
  retryIntervalMs: number = 100,
  condition?: (result: T | undefined | null) => boolean
): Promise<T | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const result = fn()

    // Use custom condition if provided, otherwise check for truthy result
    const isValid = condition ? condition(result) : Boolean(result)

    if (isValid) {
      return result as T
    }

    // Wait before next retry
    await new Promise(resolve => setTimeout(resolve, retryIntervalMs))
  }

  return null
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns The promise result or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${errorMessage} (after ${timeoutMs}ms)`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}
