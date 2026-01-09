import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto"
import type { Hex } from "viem"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string, key: Hex): string {
  const keyBuffer = Buffer.from(key.slice(2), "hex")
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  // Format: iv + authTag + encrypted (all as hex)
  return Buffer.concat([iv, authTag, encrypted]).toString("hex")
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(ciphertext: string, key: Hex): string {
  const keyBuffer = Buffer.from(key.slice(2), "hex")
  const data = Buffer.from(ciphertext, "hex")

  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })

  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString("utf8")
}

/**
 * Derive encryption key from token and wallet signature
 * Used during session handoff to ensure only the wallet owner can complete linking
 */
export function deriveEncryptionKey(token: string, walletSignature: string): Hex {
  const combined = `${token}:${walletSignature}`
  const hash = createHash("sha256").update(combined).digest("hex")
  return `0x${hash}` as Hex
}

/**
 * Generate a random token for linking
 */
export function generateLinkToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Generate a random 32-byte encryption key
 */
export function generateEncryptionKey(): Hex {
  return `0x${randomBytes(32).toString("hex")}` as Hex
}
