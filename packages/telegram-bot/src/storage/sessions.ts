import Database from "better-sqlite3"
import type { Hex, Address } from "viem"
import { encrypt, decrypt } from "../utils/crypto.js"
import { getEnv } from "../utils/env.js"
import { mkdirSync, existsSync } from "fs"
import { dirname } from "path"

export interface LinkedUser {
  telegramUserId: number
  walletAddress: Address
  encryptedSessionKey: string
  linkedAt: Date
  lastActive: Date
}

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (db) return db

  const env = getEnv()
  const dbPath = env.DATABASE_PATH

  // Ensure directory exists
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS linked_users (
      telegram_user_id INTEGER PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      encrypted_session_key TEXT NOT NULL,
      linked_at TEXT NOT NULL,
      last_active TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS link_tokens (
      token TEXT PRIMARY KEY,
      telegram_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_link_tokens_telegram_user_id
    ON link_tokens(telegram_user_id);
  `)

  return db
}

/**
 * Store a linked user with encrypted session key
 */
export function storeLinkedUser(
  telegramUserId: number,
  walletAddress: Address,
  sessionKey: Hex
): void {
  const env = getEnv()
  const encryptedKey = encrypt(sessionKey, env.SESSION_ENCRYPTION_KEY)
  const now = new Date().toISOString()

  const stmt = getDb().prepare(`
    INSERT OR REPLACE INTO linked_users
    (telegram_user_id, wallet_address, encrypted_session_key, linked_at, last_active)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(telegramUserId, walletAddress.toLowerCase(), encryptedKey, now, now)
}

/**
 * Get a linked user by Telegram user ID
 */
export function getLinkedUser(telegramUserId: number): LinkedUser | null {
  const stmt = getDb().prepare(`
    SELECT * FROM linked_users WHERE telegram_user_id = ?
  `)

  const row = stmt.get(telegramUserId) as {
    telegram_user_id: number
    wallet_address: string
    encrypted_session_key: string
    linked_at: string
    last_active: string
  } | undefined

  if (!row) return null

  return {
    telegramUserId: row.telegram_user_id,
    walletAddress: row.wallet_address as Address,
    encryptedSessionKey: row.encrypted_session_key,
    linkedAt: new Date(row.linked_at),
    lastActive: new Date(row.last_active)
  }
}

/**
 * Get the decrypted session key for a linked user
 */
export function getSessionKey(telegramUserId: number): Hex | null {
  const user = getLinkedUser(telegramUserId)
  if (!user) return null

  const env = getEnv()
  return decrypt(user.encryptedSessionKey, env.SESSION_ENCRYPTION_KEY) as Hex
}

/**
 * Update last active timestamp
 */
export function updateLastActive(telegramUserId: number): void {
  const stmt = getDb().prepare(`
    UPDATE linked_users SET last_active = ? WHERE telegram_user_id = ?
  `)

  stmt.run(new Date().toISOString(), telegramUserId)
}

/**
 * Unlink a user
 */
export function unlinkUser(telegramUserId: number): boolean {
  const stmt = getDb().prepare(`
    DELETE FROM linked_users WHERE telegram_user_id = ?
  `)

  const result = stmt.run(telegramUserId)
  return result.changes > 0
}

/**
 * Check if a user is linked
 */
export function isUserLinked(telegramUserId: number): boolean {
  return getLinkedUser(telegramUserId) !== null
}

// Link token management

export interface LinkToken {
  token: string
  telegramUserId: number
  createdAt: Date
  expiresAt: Date
  used: boolean
}

/**
 * Create a new link token
 */
export function createLinkToken(telegramUserId: number, token: string, ttlMs: number = 5 * 60 * 1000): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMs)

  const stmt = getDb().prepare(`
    INSERT INTO link_tokens (token, telegram_user_id, created_at, expires_at, used)
    VALUES (?, ?, ?, ?, 0)
  `)

  stmt.run(token, telegramUserId, now.toISOString(), expiresAt.toISOString())
}

/**
 * Get and validate a link token
 */
export function getLinkToken(token: string): LinkToken | null {
  const stmt = getDb().prepare(`
    SELECT * FROM link_tokens WHERE token = ?
  `)

  const row = stmt.get(token) as {
    token: string
    telegram_user_id: number
    created_at: string
    expires_at: string
    used: number
  } | undefined

  if (!row) return null

  return {
    token: row.token,
    telegramUserId: row.telegram_user_id,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    used: row.used === 1
  }
}

/**
 * Mark a link token as used
 */
export function markTokenUsed(token: string): void {
  const stmt = getDb().prepare(`
    UPDATE link_tokens SET used = 1 WHERE token = ?
  `)

  stmt.run(token)
}

/**
 * Clean up expired tokens
 */
export function cleanupExpiredTokens(): void {
  const stmt = getDb().prepare(`
    DELETE FROM link_tokens WHERE expires_at < ?
  `)

  stmt.run(new Date().toISOString())
}
