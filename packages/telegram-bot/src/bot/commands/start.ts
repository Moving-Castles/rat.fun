import type { Context } from "grammy"
import { isUserLinked } from "../../storage/sessions.js"

export async function startCommand(ctx: Context) {
  const userId = ctx.from?.id

  const welcomeMessage = `
Welcome to rat.fun!

Send your rats on AI-generated trips to collect tokens and items. But be careful - your rat can die!

HOW TO PLAY:
1. Link your wallet with /link
2. Create a rat with /rat
3. Browse trips with /trips
4. Enter a trip with /enter <tripId>
5. Collect tokens and items
6. Cash out with /rat liquidate

COMMANDS:
/link - Link your wallet
/status - View your rat
/trips - Browse trips
/enter - Enter a trip
/history - Past outcomes
/rat - Manage your rat
/help - All commands
`

  if (userId && isUserLinked(userId)) {
    await ctx.reply(
      welcomeMessage + "\n\nYou're already linked! Use /status to see your rat."
    )
  } else {
    await ctx.reply(
      welcomeMessage + "\n\nGet started by linking your wallet with /link"
    )
  }
}
