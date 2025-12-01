import { Address, Hex } from "viem"
import { logger } from "../../logger"

type SessionStore = {
  signers: Record<string, string> // lowercase address → private key
}

/**
 * Session key storage using localStorage
 *
 * Manages persistent session private keys for each user address.
 * Keys are stored in localStorage and survive page refreshes.
 *
 * Storage format: { signers: { "0xabc...": "0x123..." } }
 * Storage key: "drawbridge:session-signers"
 *
 * Migration: Automatically migrates from legacy "entrykit:session-signers" key
 * to maintain backwards compatibility.
 */
export class SessionStorage {
  private cache: SessionStore
  private readonly STORAGE_KEY = "drawbridge:session-signers"
  private readonly LEGACY_STORAGE_KEY = "entrykit:session-signers"

  constructor() {
    this.cache = this.load()
  }

  /**
   * Load session store from localStorage
   *
   * Attempts to load from new key first, then falls back to legacy key
   * for backwards compatibility with existing installations.
   */
  private load(): SessionStore {
    if (typeof localStorage === "undefined") {
      return { signers: {} }
    }

    // Try new key first
    let stored = localStorage.getItem(this.STORAGE_KEY)

    // Fall back to legacy key for existing users
    if (!stored) {
      stored = localStorage.getItem(this.LEGACY_STORAGE_KEY)
      if (stored) {
        logger.log("[drawbridge] Migrating session storage from legacy key")
      }
    }

    if (!stored) {
      return { signers: {} }
    }

    try {
      const parsed = JSON.parse(stored)

      // Validate structure
      if (!parsed.signers || typeof parsed.signers !== "object") {
        logger.warn("[drawbridge] Session storage corrupted - invalid structure, resetting")
        return { signers: {} }
      }

      return parsed
    } catch (err) {
      logger.error(
        "[drawbridge] Failed to parse session storage:",
        err instanceof Error ? err.message : String(err)
      )
      logger.warn("[drawbridge] Session storage will be reset")
      return { signers: {} }
    }
  }

  /**
   * Save session store to localStorage
   *
   * Saves to new key and removes legacy key to complete migration.
   */
  private save(): void {
    if (typeof localStorage === "undefined") return

    // Save to new key
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache))

    // Remove legacy key if it exists (cleanup after migration)
    if (localStorage.getItem(this.LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(this.LEGACY_STORAGE_KEY)
      logger.log("[drawbridge] Removed legacy storage key after migration")
    }
  }

  /**
   * Get session signer private key for a user address
   *
   * @param address User's wallet address
   * @returns Private key if exists, undefined otherwise
   */
  getSigner(address: Address): Hex | undefined {
    const key = address.toLowerCase()
    return this.cache.signers[key] as Hex | undefined
  }

  /**
   * Store session signer private key for a user address
   *
   * @param address User's wallet address
   * @param privateKey Session private key to store
   */
  setSigner(address: Address, privateKey: Hex): void {
    const key = address.toLowerCase()
    this.cache.signers[key] = privateKey
    this.save()
  }

  /**
   * Remove session signer for a user address
   *
   * @param address User's wallet address
   */
  removeSigner(address: Address): void {
    const key = address.toLowerCase()
    delete this.cache.signers[key]
    this.save()
  }

  /**
   * Clear all session signers
   */
  clear(): void {
    this.cache = { signers: {} }
    this.save()
  }
}

/**
 * Singleton session storage instance
 */
export const sessionStorage = new SessionStorage()
