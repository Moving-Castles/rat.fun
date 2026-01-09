import type { Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { isUserLinked, unlinkUser, getLinkedUser } from "../../storage/sessions.js"
import { generateLinkToken } from "../../utils/crypto.js"
import { createLinkToken, cleanupExpiredTokens } from "../../storage/sessions.js"
import { getEnv } from "../../utils/env.js"

export async function linkCommand(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply("Could not identify user.")
    return
  }

  // Check if already linked
  if (isUserLinked(userId)) {
    const user = getLinkedUser(userId)
    const shortAddress = user?.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : "unknown"

    await ctx.reply(
      `You're already linked to wallet ${shortAddress}.\n\n` +
      "Use /unlink to disconnect, then /link again to use a different wallet."
    )
    return
  }

  // Clean up old tokens
  cleanupExpiredTokens()

  // Generate a new link token
  const token = generateLinkToken()
  createLinkToken(userId, token)

  // Build the linking URL
  const env = getEnv()
  // Use the client URL for the linking page, not the API URL
  const linkUrl = `https://rat.fun/telegram/link?token=${token}&tgUserId=${userId}`

  const keyboard = new InlineKeyboard().url("Link Wallet", linkUrl)

  await ctx.reply(
    "To play rat.fun, you need to link your wallet.\n\n" +
    "Click the button below to open the linking page.\n" +
    "You'll need to be logged in to rat.fun first.\n\n" +
    "This link expires in 5 minutes.",
    { reply_markup: keyboard }
  )
}

export async function unlinkCommand(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply("Could not identify user.")
    return
  }

  if (!isUserLinked(userId)) {
    await ctx.reply("You're not linked to any wallet.")
    return
  }

  const keyboard = new InlineKeyboard()
    .text("Yes, unlink", "unlink_confirm")
    .text("Cancel", "unlink_cancel")

  await ctx.reply(
    "Are you sure you want to unlink your wallet?\n\n" +
    "You'll need to link again to continue playing.",
    { reply_markup: keyboard }
  )
}

// Callback handlers for unlink confirmation
export async function handleUnlinkConfirm(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) return

  const wasUnlinked = unlinkUser(userId)

  if (wasUnlinked) {
    await ctx.editMessageText(
      "Wallet unlinked successfully.\n\n" +
      "Use /link to connect a new wallet."
    )
  } else {
    await ctx.editMessageText("Failed to unlink wallet.")
  }

  await ctx.answerCallbackQuery()
}

export async function handleUnlinkCancel(ctx: Context) {
  await ctx.editMessageText("Unlink cancelled.")
  await ctx.answerCallbackQuery()
}
