/**
 * Rate limiter for chat messages.
 * Limits users to 1 message per second.
 */

const RATE_LIMIT_MS = 1000 // 1 message per second

class RateLimiter {
  private lastMessageTime: Map<string, number> = new Map()

  /**
   * Check if a player can send a message
   * @param playerId - The player's ID
   * @returns true if the player can send, false if rate limited
   */
  canSend(playerId: string): boolean {
    const now = Date.now()
    const lastTime = this.lastMessageTime.get(playerId) ?? 0
    return now - lastTime >= RATE_LIMIT_MS
  }

  /**
   * Record that a player sent a message
   * @param playerId - The player's ID
   */
  recordMessage(playerId: string): void {
    this.lastMessageTime.set(playerId, Date.now())
  }

  /**
   * Get remaining cooldown time in milliseconds
   * @param playerId - The player's ID
   * @returns Remaining cooldown in ms, or 0 if not rate limited
   */
  getRemainingCooldown(playerId: string): number {
    const now = Date.now()
    const lastTime = this.lastMessageTime.get(playerId) ?? 0
    const elapsed = now - lastTime
    return Math.max(0, RATE_LIMIT_MS - elapsed)
  }

  /**
   * Clear rate limit data for a player (useful when they disconnect)
   * @param playerId - The player's ID
   */
  clearPlayer(playerId: string): void {
    this.lastMessageTime.delete(playerId)
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()
