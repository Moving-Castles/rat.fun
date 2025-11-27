import { Command } from "commander"
import { runBot } from "./bot"
import { loadConfig } from "./config"

const program = new Command()
  .name("rattus-bot")
  .description("Autonomous rat.fun player bot")
  .version("1.0.0")
  .option("-c, --chain <id>", "Chain ID (8453=Base, 84532=Base Sepolia, 31337=local)")
  .option("-s, --selector <type>", "Trip selector: claude or heuristic")
  .option("-r, --auto-respawn", "Automatically create new rat on death")
  .option("-n, --name <name>", "Name for the rat")
  .option("-l, --liquidate-at <value>", "Liquidate rat when total value reaches this threshold")
  .option(
    "-b, --liquidate-below <value>",
    "Liquidate rat when total value falls below this threshold"
  )
  .action(async options => {
    try {
      const config = loadConfig({
        chain: options.chain,
        selector: options.selector,
        autoRespawn: options.autoRespawn,
        name: options.name,
        liquidateAt: options.liquidateAt,
        liquidateBelow: options.liquidateBelow
      })

      await runBot(config)
    } catch (error) {
      console.error("Fatal error:", error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

program.parse()
