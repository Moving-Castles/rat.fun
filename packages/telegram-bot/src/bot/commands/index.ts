import type { Bot } from "grammy"
import { startCommand } from "./start.js"
import { linkCommand, unlinkCommand } from "./link.js"
import { statusCommand } from "./status.js"
import { tripsCommand } from "./trips.js"
import { ratCommand } from "./rat.js"
import { enterCommand } from "./enter.js"
import { historyCommand } from "./history.js"
import { helpCommand } from "./help.js"

/**
 * Register all bot commands
 */
export function registerCommands(bot: Bot) {
  // Public commands
  bot.command("start", startCommand)
  bot.command("help", helpCommand)
  bot.command("link", linkCommand)

  // Authenticated commands
  bot.command("unlink", unlinkCommand)
  bot.command("status", statusCommand)
  bot.command("trips", tripsCommand)
  bot.command("rat", ratCommand)
  bot.command("enter", enterCommand)
  bot.command("history", historyCommand)

  // Set bot commands list for Telegram menu
  bot.api.setMyCommands([
    { command: "start", description: "Welcome and how to play" },
    { command: "link", description: "Link your wallet" },
    { command: "status", description: "View your rat status" },
    { command: "trips", description: "Browse available trips" },
    { command: "rat", description: "Create or liquidate your rat" },
    { command: "enter", description: "Enter a trip (e.g., /enter tripId)" },
    { command: "history", description: "View past trip outcomes" },
    { command: "help", description: "Show all commands" }
  ])
}
