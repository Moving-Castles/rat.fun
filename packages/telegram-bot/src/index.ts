import { Bot } from "grammy"
import { startApiServer } from "./api/server.js"
import { registerCommands } from "./bot/commands/index.js"
import { registerCallbacks } from "./bot/callbacks/index.js"
import { authMiddleware } from "./bot/middleware/auth.js"
import { getEnv } from "./utils/env.js"

async function main() {
  const env = getEnv()

  // Initialize Telegram bot
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  // Register middleware
  bot.use(authMiddleware)

  // Register commands and callbacks
  registerCommands(bot)
  registerCallbacks(bot)

  // Start API server for session handoff
  const apiServer = await startApiServer(env.API_PORT)
  console.log(`API server listening on port ${env.API_PORT}`)

  // Start bot (long polling for dev, webhook for production)
  if (env.TELEGRAM_WEBHOOK_URL) {
    // Webhook mode for production
    await bot.api.setWebhook(env.TELEGRAM_WEBHOOK_URL)
    console.log(`Telegram webhook set to ${env.TELEGRAM_WEBHOOK_URL}`)
  } else {
    // Long polling mode for development
    bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started in long polling mode`)
      }
    })
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...")
    bot.stop()
    apiServer.close()
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

main().catch((err) => {
  console.error("Failed to start bot:", err)
  process.exit(1)
})
