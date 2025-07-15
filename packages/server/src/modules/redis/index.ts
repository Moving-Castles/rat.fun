import { createClient, RedisClientType } from "redis"
import type { OffChainMessage } from "@modules/types"

// In-memory storage for local development
class InMemoryStore {
  private messages: OffChainMessage[] = []
  private nonces: Record<number, boolean> = {}

  async storeMessage(message: OffChainMessage): Promise<OffChainMessage> {
    this.messages.push(message)
    return message
  }

  async getMessages(limit?: number): Promise<OffChainMessage[]> {
    const messages = [...this.messages]
    // Sort by timestamp: oldest first, newest last
    messages.sort((a, b) => a.timestamp - b.timestamp)
    return limit ? messages.slice(-limit) : messages
  }

  async storeNonce(nonce: number): Promise<void> {
    this.nonces[nonce] = true
  }

  async hasNonce(nonce: number): Promise<boolean> {
    return this.nonces[nonce] ?? false
  }
}

// Redis client wrapper
class RedisStore {
  private client: RedisClientType
  private isConnected = false

  constructor(redisUrl?: string) {
    this.client = createClient({
      url: redisUrl
    })

    this.client.on("error", err => {
      console.error("Redis Client Error:", err)
      this.isConnected = false
    })

    this.client.on("connect", () => {
      console.log("Redis Client Connected")
      this.isConnected = true
    })
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect()
    }
  }

  async storeMessage(message: OffChainMessage): Promise<OffChainMessage> {
    await this.connect()
    const key = `message:${message.id}`
    await this.client.set(key, JSON.stringify(message))
    await this.client.lPush("messages:list", key)
    // Keep only last 1000 messages
    await this.client.lTrim("messages:list", 0, 999)
    return message
  }

  async getMessages(limit?: number): Promise<OffChainMessage[]> {
    await this.connect()
    const messageKeys = await this.client.lRange("messages:list", 0, -1)
    const messages: OffChainMessage[] = []

    for (const key of messageKeys) {
      const messageData = await this.client.get(key)
      if (messageData) {
        messages.push(JSON.parse(messageData))
      }
    }

    // Sort by timestamp: oldest first, newest last
    messages.sort((a, b) => a.timestamp - b.timestamp)
    return limit ? messages.slice(-limit) : messages
  }

  async storeNonce(nonce: number): Promise<void> {
    await this.connect()
    await this.client.set(`nonce:${nonce}`, "true", { EX: 60 }) // Expire after 60 seconds
  }

  async hasNonce(nonce: number): Promise<boolean> {
    await this.connect()
    const exists = await this.client.exists(`nonce:${nonce}`)
    return exists === 1
  }
}

// Factory function to create the appropriate store
export function createStore(): InMemoryStore | RedisStore {
  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    console.log("Using Redis store")
    return new RedisStore(redisUrl)
  } else {
    console.log("Using in-memory store for development")
    return new InMemoryStore()
  }
}

// Export types for convenience
export type Store = InMemoryStore | RedisStore
