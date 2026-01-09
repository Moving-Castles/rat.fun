import type { Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { getLinkedUser } from "../../storage/sessions.js"
import { getQueryServerClient } from "../../services/query-server.js"
import { formatRatStatus } from "../../utils/formatter.js"

export async function ratCommand(ctx: Context) {
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

  // Check for subcommand
  const text = ctx.message?.text || ""
  const parts = text.split(" ")

  if (parts.length > 1) {
    const subcommand = parts[1].toLowerCase()
    if (subcommand === "liquidate") {
      await showLiquidateConfirmation(ctx, userId)
      return
    }
  }

  // Default: show rat management menu
  await showRatMenu(ctx, userId)
}

async function showRatMenu(ctx: Context, userId: number) {
  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) return

  try {
    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration) {
      await ctx.reply("You haven't spawned yet on rat.fun. Visit rat.fun to create your player first.")
      return
    }

    const { currentRat, items } = hydration

    if (currentRat && !currentRat.dead) {
      // Has live rat - show status and liquidate option
      const message = formatRatStatus(currentRat, items)

      const keyboard = new InlineKeyboard()
        .text("Liquidate Rat", "rat_liquidate_confirm")
        .row()
        .text("Browse Trips", "trips_page_1")

      await ctx.reply(
        "RAT MANAGEMENT\n━━━━━━━━━━━━━━━━━━━\n\n" + message,
        { reply_markup: keyboard }
      )
    } else {
      // No rat or dead rat - show create option
      const config = await queryClient.getConfig()
      const ratCost = parseInt(config.gameConfig.ratCreationCost || "100", 10)

      const keyboard = new InlineKeyboard()
        .text(`Create Rat (${ratCost} tokens)`, "rat_create")

      await ctx.reply(
        "RAT MANAGEMENT\n━━━━━━━━━━━━━━━━━━━\n\n" +
        "You don't have a live rat.\n\n" +
        `Creating a rat costs ${ratCost} tokens.\n` +
        "Your rat will start with this balance.",
        { reply_markup: keyboard }
      )
    }
  } catch (error) {
    console.error("Error in rat menu:", error)
    await ctx.reply("Failed to load rat info. Please try again.")
  }
}

async function showLiquidateConfirmation(ctx: Context, userId: number) {
  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) return

  try {
    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration?.currentRat || hydration.currentRat.dead) {
      await ctx.reply("You don't have a live rat to liquidate.")
      return
    }

    const { currentRat } = hydration
    const totalValue = parseInt(currentRat.totalValue || "0", 10)
    const config = await queryClient.getConfig()
    const taxRate = config.gamePercentagesConfig.taxationLiquidateRat || 5
    const taxAmount = Math.floor(totalValue * taxRate / 100)
    const netValue = totalValue - taxAmount

    const keyboard = new InlineKeyboard()
      .text("Yes, Liquidate", "rat_liquidate_execute")
      .text("Cancel", "rat_liquidate_cancel")

    await ctx.reply(
      "LIQUIDATE RAT\n━━━━━━━━━━━━━━━━━━━\n\n" +
      `Rat: ${currentRat.name}\n` +
      `Total Value: ${totalValue} tokens\n` +
      `Tax (${taxRate}%): -${taxAmount} tokens\n` +
      `You'll receive: ${netValue} tokens\n\n` +
      "Are you sure? This cannot be undone.",
      { reply_markup: keyboard }
    )
  } catch (error) {
    console.error("Error showing liquidate confirmation:", error)
    await ctx.reply("Failed to load rat info. Please try again.")
  }
}

export { showRatMenu, showLiquidateConfirmation }
