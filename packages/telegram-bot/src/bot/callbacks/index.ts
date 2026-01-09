import type { Bot, Context } from "grammy"
import { handleUnlinkConfirm, handleUnlinkCancel } from "../commands/link.js"
import { showRatMenu, showLiquidateConfirmation } from "../commands/rat.js"
import { executeTripEntry, showTripEntry } from "../commands/enter.js"
import { getCachedTrips, buildPaginationKeyboard, TRIPS_PER_PAGE } from "../commands/trips.js"
import { formatTripList, formatTripDetails } from "../../utils/formatter.js"
import { getQueryServerClient } from "../../services/query-server.js"
import { getLinkedUser } from "../../storage/sessions.js"

/**
 * Register all callback query handlers
 */
export function registerCallbacks(bot: Bot) {
  // Unlink confirmation
  bot.callbackQuery("unlink_confirm", handleUnlinkConfirm)
  bot.callbackQuery("unlink_cancel", handleUnlinkCancel)

  // Rat management
  bot.callbackQuery("rat_create", handleRatCreate)
  bot.callbackQuery("rat_liquidate_confirm", handleRatLiquidateConfirm)
  bot.callbackQuery("rat_liquidate_execute", handleRatLiquidateExecute)
  bot.callbackQuery("rat_liquidate_cancel", handleRatLiquidateCancel)

  // Trips pagination
  bot.callbackQuery(/^trips_page_(\d+)$/, handleTripsPage)
  bot.callbackQuery("trips_noop", (ctx) => ctx.answerCallbackQuery())

  // Trip viewing and entry
  bot.callbackQuery(/^trip_view_(.+)$/, handleTripView)
  bot.callbackQuery(/^trip_enter_execute_(.+)$/, handleTripEnterExecute)
  bot.callbackQuery("trip_enter_cancel", handleTripEnterCancel)

  // Status refresh
  bot.callbackQuery("show_status", handleShowStatus)
}

// === Rat management callbacks ===

async function handleRatCreate(ctx: Context) {
  await ctx.answerCallbackQuery()

  await ctx.editMessageText(
    "Creating rats via Telegram is not yet supported.\n\n" +
    "Please visit rat.fun to create your rat, then come back here to play!"
  )
}

async function handleRatLiquidateConfirm(ctx: Context) {
  await ctx.answerCallbackQuery()
  const userId = ctx.from?.id
  if (!userId) return

  await showLiquidateConfirmation(ctx, userId)
}

async function handleRatLiquidateExecute(ctx: Context) {
  await ctx.answerCallbackQuery()

  await ctx.editMessageText(
    "Liquidating rats via Telegram is not yet supported.\n\n" +
    "Please visit rat.fun to liquidate your rat."
  )
}

async function handleRatLiquidateCancel(ctx: Context) {
  await ctx.answerCallbackQuery()
  await ctx.editMessageText("Liquidation cancelled.")
}

// === Trips callbacks ===

async function handleTripsPage(ctx: Context) {
  await ctx.answerCallbackQuery()

  const userId = ctx.from?.id
  if (!userId) return

  const match = ctx.callbackQuery?.data?.match(/^trips_page_(\d+)$/)
  if (!match) return

  const page = parseInt(match[1], 10)
  const trips = getCachedTrips(userId)

  if (!trips) {
    await ctx.editMessageText(
      "Trip data expired. Use /trips to refresh."
    )
    return
  }

  const message = formatTripList(trips, page, TRIPS_PER_PAGE)
  const keyboard = buildPaginationKeyboard(trips, page, TRIPS_PER_PAGE)

  await ctx.editMessageText(message, { reply_markup: keyboard })
}

async function handleTripView(ctx: Context) {
  await ctx.answerCallbackQuery()

  const match = ctx.callbackQuery?.data?.match(/^trip_view_(.+)$/)
  if (!match) return

  const tripId = match[1]
  const userId = ctx.from?.id
  if (!userId) return

  try {
    const queryClient = getQueryServerClient()
    const trip = await queryClient.getTrip(tripId)

    if (!trip) {
      await ctx.editMessageText("Trip not found.")
      return
    }

    const message = formatTripDetails(trip)

    const { InlineKeyboard } = await import("grammy")
    const keyboard = new InlineKeyboard()
      .text("Enter Trip", `trip_enter_execute_${tripId}`)
      .row()
      .text("◀️ Back to Trips", "trips_page_1")

    await ctx.editMessageText(message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error viewing trip:", error)
    await ctx.editMessageText("Failed to load trip details.")
  }
}

async function handleTripEnterExecute(ctx: Context) {
  await ctx.answerCallbackQuery()

  const match = ctx.callbackQuery?.data?.match(/^trip_enter_execute_(.+)$/)
  if (!match) return

  const tripId = match[1]
  await executeTripEntry(ctx, tripId)
}

async function handleTripEnterCancel(ctx: Context) {
  await ctx.answerCallbackQuery()
  await ctx.editMessageText("Trip entry cancelled.")
}

// === Status callback ===

async function handleShowStatus(ctx: Context) {
  await ctx.answerCallbackQuery()

  const userId = ctx.from?.id
  if (!userId) return

  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) {
    await ctx.editMessageText("You need to link your wallet first. Use /link")
    return
  }

  try {
    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration) {
      await ctx.editMessageText("Could not fetch your status. Please try /status")
      return
    }

    const { formatPlayerStatus, formatRatStatus } = await import("../../utils/formatter.js")
    let message = formatPlayerStatus(hydration.player)

    if (hydration.currentRat) {
      message += "\n\n" + formatRatStatus(hydration.currentRat, hydration.items)
    } else {
      message += "\n\nYou don't have a rat yet."
    }

    const { InlineKeyboard } = await import("grammy")
    const keyboard = new InlineKeyboard()
      .text("Browse Trips", "trips_page_1")
      .text("Refresh", "show_status")

    await ctx.editMessageText(message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error showing status:", error)
    await ctx.editMessageText("Failed to load status. Use /status to try again.")
  }
}
