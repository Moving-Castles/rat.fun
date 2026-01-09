import type { Hex, Address } from "viem"

export interface Env {
  // Telegram
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_URL?: string

  // Servers
  GAME_SERVER_URL: string
  QUERY_SERVER_URL: string

  // Blockchain
  CHAIN_ID: number
  RPC_URL: string
  WORLD_ADDRESS: Address

  // Security
  SESSION_ENCRYPTION_KEY: Hex

  // Sanity CMS
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string

  // Database
  DATABASE_PATH: string

  // API Server
  API_PORT: number
  API_URL: string
}

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv

  const required = (key: string): string => {
    const value = process.env[key]
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return value
  }

  const optional = (key: string): string | undefined => {
    return process.env[key]
  }

  cachedEnv = {
    // Telegram
    TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
    TELEGRAM_WEBHOOK_URL: optional("TELEGRAM_WEBHOOK_URL"),

    // Servers
    GAME_SERVER_URL: required("GAME_SERVER_URL"),
    QUERY_SERVER_URL: required("QUERY_SERVER_URL"),

    // Blockchain
    CHAIN_ID: parseInt(required("CHAIN_ID"), 10),
    RPC_URL: required("RPC_URL"),
    WORLD_ADDRESS: required("WORLD_ADDRESS") as Address,

    // Security
    SESSION_ENCRYPTION_KEY: required("SESSION_ENCRYPTION_KEY") as Hex,

    // Sanity CMS
    SANITY_PROJECT_ID: required("SANITY_PROJECT_ID"),
    SANITY_DATASET: required("SANITY_DATASET"),

    // Database
    DATABASE_PATH: optional("DATABASE_PATH") || "./data/sessions.db",

    // API Server
    API_PORT: parseInt(optional("API_PORT") || "3001", 10),
    API_URL: required("API_URL")
  }

  return cachedEnv
}
