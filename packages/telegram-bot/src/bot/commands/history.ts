import type { Context } from "grammy"
import { getLinkedUser } from "../../storage/sessions.js"
import { getQueryServerClient } from "../../services/query-server.js"
import { getSanityClient, formatOutcomeHistory } from "../../services/sanity.js"

export async function historyCommand(ctx: Context) {
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

  await ctx.reply("Loading trip history...")

  try {
    // Get current rat ID
    const queryClient = getQueryServerClient()
    const hydration = await queryClient.getHydration(linkedUser.walletAddress)

    if (!hydration?.currentRat) {
      await ctx.reply("You don't have a rat yet. Use /rat to create one.")
      return
    }

    // Get outcomes from Sanity
    const sanityClient = getSanityClient()
    const outcomes = await sanityClient.getOutcomesForRat(hydration.currentRat.id)

    if (outcomes.length === 0) {
      await ctx.reply(
        "No trip history found for your current rat.\n\n" +
        "Enter some trips with /enter to build history!"
      )
      return
    }

    const message = formatOutcomeHistory(outcomes)
    await ctx.reply(message)
  } catch (error) {
    console.error("Error fetching history:", error)
    await ctx.reply("Failed to fetch history. Please try again.")
  }
}
