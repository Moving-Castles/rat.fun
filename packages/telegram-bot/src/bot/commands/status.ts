import type { Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { getLinkedUser } from "../../storage/sessions.js"
import { getQueryServerClient } from "../../services/query-server.js"
import { formatRatStatus, formatPlayerStatus } from "../../utils/formatter.js"

export async function statusCommand(ctx: Context) {
  const userId = ctx.from?.id
  if (!userId) {
    await ctx.reply("Could not identify user.")
    return
  }

  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) {
    await ctx.reply("You need to link your wallet first. Use /link")
    return
  }

  await ctx.reply("Loading your status...")

  try {
    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration) {
      await ctx.reply(
        "You haven't spawned yet on rat.fun.\n\n" +
        "Please visit rat.fun to create your player first."
      )
      return
    }

    const { player, currentRat, items } = hydration

    // Build status message
    let message = formatPlayerStatus(player)

    if (currentRat) {
      message += "\n\n" + formatRatStatus(currentRat, items)

      const keyboard = new InlineKeyboard()
        .text("Browse Trips", "trips_page_1")
        .text("Liquidate", "rat_liquidate_confirm")

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: "HTML"
      })
    } else {
      message += "\n\nYou don't have a rat yet.\nUse /rat to create one."

      const keyboard = new InlineKeyboard()
        .text("Create Rat", "rat_create")

      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: "HTML"
      })
    }
  } catch (error) {
    console.error("Error fetching status:", error)
    await ctx.reply("Failed to fetch status. Please try again.")
  }
}
