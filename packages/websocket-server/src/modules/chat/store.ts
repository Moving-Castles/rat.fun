import type { ChatBroadcastMessage } from "../types"

/**
 * Interface for chat message storage.
 * Allows for future extension to persistent storage (Redis, PostgreSQL, etc.)
 */
export interface ChatStore {
  /**
   * Add a message to the store
   */
  addMessage(message: ChatBroadcastMessage): void

  /**
   * Get the most recent messages
   * @param limit - Maximum number of messages to return
   */
  getRecentMessages(limit?: number): Omit<ChatBroadcastMessage, "topic">[]

  /**
   * Clear all messages (useful for testing)
   */
  clear(): void
}

/**
 * In-memory implementation of ChatStore.
 * Messages are lost on server restart.
 */
class InMemoryChatStore implements ChatStore {
  private messages: ChatBroadcastMessage[] = []
  private readonly maxMessages: number

  constructor(maxMessages: number = 100) {
    this.maxMessages = maxMessages
  }

  addMessage(message: ChatBroadcastMessage): void {
    this.messages.push(message)
    // Trim to max messages to prevent memory growth
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
  }

  getRecentMessages(limit: number = 20): Omit<ChatBroadcastMessage, "topic">[] {
    const recent = this.messages.slice(-limit)
    // Strip the topic field for history messages
    return recent.map(({ topic, ...rest }) => rest)
  }

  clear(): void {
    this.messages = []
  }
}

// Export singleton instance
export const chatStore: ChatStore = new InMemoryChatStore()
