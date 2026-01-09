import type { Context } from "grammy"

export async function helpCommand(ctx: Context) {
  const helpText = `
COMMANDS:

/start - Welcome message and how to play

/link - Link your wallet to Telegram
/unlink - Disconnect your wallet

/status - View your current rat status
/rat - Create or liquidate your rat
/trips - Browse available trips
/enter <tripId> - Enter a specific trip
/history - View your past trip outcomes

/help - Show this help message

GAMEPLAY:

1. First, link your wallet with /link
2. Create a rat (costs tokens) with /rat
3. Browse trips to find one you like
4. Enter a trip - your rat will experience an AI-generated adventure
5. Win tokens and items, or risk death
6. Cash out your rat with /rat liquidate

TIPS:

- Your rat's total value = balance + inventory items
- Trips have minimum entry values
- If your rat's balance reaches 0, it dies
- Higher value rats can access better trips
`

  await ctx.reply(helpText)
}
