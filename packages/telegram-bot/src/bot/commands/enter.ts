import type { Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { getLinkedUser } from "../../storage/sessions.js"
import { getQueryServerClient } from "../../services/query-server.js"
import { getGameServerClient, formatTripOutcome } from "../../services/game-server.js"
import { formatTripDetails } from "../../utils/formatter.js"

export async function enterCommand(ctx: Context) {
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

  // Parse trip ID from command
  const text = ctx.message?.text || ""
  const parts = text.split(" ")

  if (parts.length < 2) {
    await ctx.reply(
      "Usage: /enter <tripId>\n\n" +
      "Use /trips to browse available trips and get their IDs."
    )
    return
  }

  const tripId = parts[1]

  // Validate trip ID format (should be hex)
  if (!tripId.startsWith("0x")) {
    await ctx.reply("Invalid trip ID format. Trip IDs should start with 0x")
    return
  }

  await showTripEntry(ctx, userId, tripId)
}

async function showTripEntry(ctx: Context, userId: number, tripId: string) {
  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) return

  try {
    const queryClient = getQueryServerClient()

    // Fetch trip, rat, and config in parallel
    const [trip, hydration, config] = await Promise.all([
      queryClient.getTrip(tripId),
      queryClient.getHydration(linkedUser.walletAddress),
      queryClient.getConfig()
    ])

    if (!trip) {
      await ctx.reply("Trip not found. Use /trips to browse available trips.")
      return
    }

    if (!hydration?.currentRat || hydration.currentRat.dead) {
      await ctx.reply("You need a live rat to enter trips. Use /rat to create one.")
      return
    }

    const ratValue = parseInt(hydration.currentRat.totalValue || "0", 10)
    const tripBalance = parseInt(trip.balance || "0", 10)
    const minEntry = parseInt(trip.tripCreationCost || "0", 10) *
      (config.gamePercentagesConfig.minRatValueToEnter || 10) / 100

    // Validation
    if (tripBalance === 0) {
      await ctx.reply("This trip has been depleted and cannot be entered.")
      return
    }

    if (ratValue < minEntry) {
      await ctx.reply(
        `Your rat's value (${ratValue}) is below the minimum (${Math.round(minEntry)}).\n\n` +
        "Try entering a different trip or increasing your rat's value."
      )
      return
    }

    // Show trip details and confirmation
    const message = formatTripDetails(trip) +
      `\n\nYour rat: ${hydration.currentRat.name}\n` +
      `Rat value: ${ratValue} tokens`

    const keyboard = new InlineKeyboard()
      .text("Enter Trip", `trip_enter_execute_${tripId}`)
      .text("Cancel", "trip_enter_cancel")

    await ctx.reply(message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error in enter command:", error)
    await ctx.reply("Failed to load trip info. Please try again.")
  }
}

// Execute trip entry - called from callback
export async function executeTripEntry(ctx: Context, tripId: string) {
  const userId = ctx.from?.id
  if (!userId) return

  const linkedUser = getLinkedUser(userId)
  if (!linkedUser) return

  try {
    // Update message to show processing
    await ctx.editMessageText(
      "🔄 Processing trip entry...\n\n" +
      "This may take up to a minute as we generate your adventure."
    )

    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration?.currentRat || hydration.currentRat.dead) {
      await ctx.editMessageText("You need a live rat to enter trips.")
      return
    }

    const ratId = hydration.currentRat.id

    // Call game server
    const gameClient = getGameServerClient()
    const outcome = await gameClient.enterTrip(userId, tripId, ratId)

    // Format and display outcome
    const message = formatTripOutcome(outcome)

    const keyboard = new InlineKeyboard()
      .text("View Rat", "show_status")
      .text("More Trips", "trips_page_1")

    await ctx.editMessageText(
      "TRIP OUTCOME\n━━━━━━━━━━━━━━━━━━━\n\n" + message,
      { reply_markup: keyboard }
    )
  } catch (error) {
    console.error("Error executing trip entry:", error)
    await ctx.editMessageText(
      `Failed to enter trip: ${error instanceof Error ? error.message : "Unknown error"}\n\n` +
      "Please try again later."
    )
  }
}

export { showTripEntry }
