import type { Context } from "grammy"
import { InlineKeyboard } from "grammy"
import { getLinkedUser } from "../../storage/sessions.js"
import { getQueryServerClient, type TripResponse } from "../../services/query-server.js"
import { formatTripList } from "../../utils/formatter.js"

const TRIPS_PER_PAGE = 5

// Cache trips temporarily to avoid refetching for pagination
const tripsCache = new Map<number, { trips: TripResponse[]; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

function getCachedTrips(userId: number): TripResponse[] | null {
  const cached = tripsCache.get(userId)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    tripsCache.delete(userId)
    return null
  }
  return cached.trips
}

function setCachedTrips(userId: number, trips: TripResponse[]): void {
  tripsCache.set(userId, { trips, timestamp: Date.now() })
}

export async function tripsCommand(ctx: Context) {
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

  await ctx.reply("Loading available trips...")

  try {
    const queryClient = getQueryServerClient()
    // Use the available trips endpoint which returns all trips with balance > 0
    const response = await queryClient.getAvailableTrips({
      limit: 100, // Get enough for local pagination/caching
      sortBy: "balance",
      sortOrder: "desc"
    })

    const activeTrips = response.trips

    // Cache trips for pagination
    setCachedTrips(userId, activeTrips)

    if (activeTrips.length === 0) {
      await ctx.reply("No active trips available at the moment.")
      return
    }

    const message = formatTripList(activeTrips, 1, TRIPS_PER_PAGE)
    const keyboard = buildPaginationKeyboard(activeTrips, 1, TRIPS_PER_PAGE)

    await ctx.reply(message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error fetching trips:", error)
    await ctx.reply("Failed to fetch trips. Please try again.")
  }
}

function buildPaginationKeyboard(
  trips: TripResponse[],
  currentPage: number,
  perPage: number
): InlineKeyboard {
  const totalPages = Math.ceil(trips.length / perPage)
  const keyboard = new InlineKeyboard()

  // Add trip selection buttons for current page
  const start = (currentPage - 1) * perPage
  const pageTrips = trips.slice(start, start + perPage)

  for (let i = 0; i < pageTrips.length; i++) {
    const tripNum = start + i + 1
    const tripId = pageTrips[i].id
    keyboard.text(`${tripNum}`, `trip_view_${tripId}`)
  }
  keyboard.row()

  // Add pagination buttons
  if (currentPage > 1) {
    keyboard.text("◀️ Prev", `trips_page_${currentPage - 1}`)
  }
  keyboard.text(`${currentPage}/${totalPages}`, "trips_noop")
  if (currentPage < totalPages) {
    keyboard.text("Next ▶️", `trips_page_${currentPage + 1}`)
  }

  return keyboard
}

// Export for callback handler
export { getCachedTrips, setCachedTrips, buildPaginationKeyboard, TRIPS_PER_PAGE }
