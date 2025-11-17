import { Address, Hex } from "viem"

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
 * Storage key: "entrykit:session-signers"
 */
export class SessionStorage {
  private cache: SessionStore
  private readonly STORAGE_KEY = "entrykit:session-signers"

  constructor() {
    this.cache = this.load()
  }

  /**
   * Load session store from localStorage
   */
  private load(): SessionStore {
    if (typeof localStorage === "undefined") {
      return { signers: {} }
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      return { signers: {} }
    }

    try {
      return JSON.parse(stored)
    } catch {
      return { signers: {} }
    }
  }

  /**
   * Save session store to localStorage
   */
  private save(): void {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache))
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
