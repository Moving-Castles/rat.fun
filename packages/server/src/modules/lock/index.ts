import { createClient, RedisClientType } from "redis"
import {
  RedisConnectionError,
  RedisOperationError,
  TripEntryLockError
} from "@modules/error-handling/errors"

const LOCK_TTL_SECONDS = 30
const LOCK_PREFIX = "trip-entry-lock:"

// In-memory storage for local development
class InMemoryLockStore {
  private locks: Map<string, number> = new Map() // Map<playerId, expirationTimestamp>

  async acquireLock(playerId: string): Promise<boolean> {
    this.cleanupExpiredLocks()

    const existingExpiration = this.locks.get(playerId)
    if (existingExpiration && Date.now() < existingExpiration) {
      // Lock exists and hasn't expired
      return false
    }

    // Set lock with expiration
    const expirationTime = Date.now() + LOCK_TTL_SECONDS * 1000
    this.locks.set(playerId, expirationTime)
    return true
  }

  async releaseLock(playerId: string): Promise<void> {
    this.locks.delete(playerId)
  }

  private cleanupExpiredLocks(): void {
    const now = Date.now()
    for (const [playerId, expirationTime] of this.locks.entries()) {
      if (now >= expirationTime) {
        this.locks.delete(playerId)
      }
    }
  }
}

// Redis lock store for production
class RedisLockStore {
  private client: RedisClientType
  private isConnected = false

  constructor(redisUrl?: string) {
    this.client = createClient({
      url: redisUrl
    })

    this.client.on("error", err => {
      console.error("Redis Lock Client Error:", err)
      this.isConnected = false
    })

    this.client.on("connect", () => {
      console.log("Redis Lock Client Connected")
      this.isConnected = true
    })
  }

  private async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect()
      }
    } catch (error) {
      throw new RedisConnectionError(
        `Failed to connect to Redis for lock: ${error instanceof Error ? error.message : String(error)}`,
        error
      )
    }
  }

  async acquireLock(playerId: string): Promise<boolean> {
    try {
      await this.connect()
      // SET NX EX is atomic: only sets if key doesn't exist, with expiration
      const result = await this.client.set(`${LOCK_PREFIX}${playerId}`, "locked", {
        NX: true, // Only set if not exists
        EX: LOCK_TTL_SECONDS // Expire after 30 seconds
      })
      return result === "OK"
    } catch (error) {
      if (error instanceof RedisConnectionError) {
        throw error
      }
      throw new RedisOperationError(
        `Failed to acquire lock: ${error instanceof Error ? error.message : String(error)}`,
        "acquireLock",
        error
      )
    }
  }

  async releaseLock(playerId: string): Promise<void> {
    try {
      await this.connect()
      await this.client.del(`${LOCK_PREFIX}${playerId}`)
    } catch (error) {
      if (error instanceof RedisConnectionError) {
        throw error
      }
      throw new RedisOperationError(
        `Failed to release lock: ${error instanceof Error ? error.message : String(error)}`,
        "releaseLock",
        error
      )
    }
  }
}

// Singleton instance
let lockStoreInstance: InMemoryLockStore | RedisLockStore | null = null

// Factory function to create the appropriate lock store (singleton pattern)
function getLockStore(): InMemoryLockStore | RedisLockStore {
  if (lockStoreInstance) {
    return lockStoreInstance
  }

  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    console.log("Using Redis lock store")
    lockStoreInstance = new RedisLockStore(redisUrl)
  } else {
    console.log("Using in-memory lock store for development")
    lockStoreInstance = new InMemoryLockStore()
  }

  return lockStoreInstance
}

/**
 * Acquire a trip entry lock for a player.
 * Throws TripEntryLockError if the player already has a trip entry in progress.
 * Lock automatically expires after 30 seconds.
 *
 * @param playerId - The player ID to lock
 * @throws TripEntryLockError if lock cannot be acquired
 */
export async function acquireTripEntryLock(playerId: string): Promise<void> {
  const store = getLockStore()
  const acquired = await store.acquireLock(playerId)

  if (!acquired) {
    throw new TripEntryLockError(
      `Trip entry already in progress for player ${playerId}. Please wait for it to complete.`,
      playerId
    )
  }
}

/**
 * Release a trip entry lock for a player.
 * Safe to call even if lock doesn't exist.
 *
 * @param playerId - The player ID to unlock
 */
export async function releaseTripEntryLock(playerId: string): Promise<void> {
  const store = getLockStore()
  await store.releaseLock(playerId)
}

/**
 * Execute a function with a trip entry lock.
 * Automatically acquires lock before execution and releases after completion or error.
 *
 * @param playerId - The player ID to lock
 * @param fn - The async function to execute while holding the lock
 * @returns The result of the function
 * @throws TripEntryLockError if lock cannot be acquired
 */
export async function withTripEntryLock<T>(playerId: string, fn: () => Promise<T>): Promise<T> {
  await acquireTripEntryLock(playerId)
  try {
    return await fn()
  } finally {
    await releaseTripEntryLock(playerId)
  }
}
