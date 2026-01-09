import type { Context, NextFunction } from "grammy"
import { isUserLinked, updateLastActive, getLinkedUser } from "../../storage/sessions.js"

// Commands that don't require linking
const PUBLIC_COMMANDS = ["/start", "/help", "/link"]

/**
 * Auth middleware that checks if the user is linked
 * for commands that require authentication
 */
export async function authMiddleware(ctx: Context, next: NextFunction) {
  // Skip auth check for public commands
  if (ctx.message?.text) {
    const command = ctx.message.text.split(" ")[0]
    if (PUBLIC_COMMANDS.includes(command)) {
      return next()
    }
  }

  // Skip auth check for callback queries that start with "link"
  if (ctx.callbackQuery?.data?.startsWith("link")) {
    return next()
  }

  // Check if user is linked for other commands
  const userId = ctx.from?.id
  if (!userId) {
    return // No user ID, can't process
  }

  if (!isUserLinked(userId)) {
    await ctx.reply(
      "You need to link your wallet first.\n\n" +
      "Use /link to get started."
    )
    return
  }

  // Update last active timestamp
  updateLastActive(userId)

  return next()
}

/**
 * Helper to get linked user info in command handlers
 */
export function getLinkedUserFromContext(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return null
  return getLinkedUser(userId)
}
