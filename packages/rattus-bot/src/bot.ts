import Anthropic from "@anthropic-ai/sdk"
import type { Config, Rat, TripOutcomeHistory } from "./types"
import {
  setupMud,
  spawn,
  createRat,
  approveMaxTokens,
  getAllowance,
  getAvailableTrips,
  getPlayer,
  getRat,
  getGameConfig,
  canRatEnterTrip,
  getRatTotalValue,
  getInventoryDetails,
  type SetupResult
} from "./modules/mud"
import { enterTrip } from "./modules/server"
import { selectTrip } from "./modules/trip-selector"
import { addressToId, sleep, retryUntilResult } from "./modules/utils"
import {
  logInfo,
  logSuccess,
  logWarning,
  logError,
  logTrip,
  logRat,
  logDeath,
  logStats
} from "./modules/logger"
import { loadOutcomeHistory, saveOutcomeHistory } from "./modules/history"

// Add liquidateRat action
async function liquidateRat(mud: SetupResult): Promise<string> {
  console.log("Liquidating rat...")
  const tx = await mud.worldContract.write.ratfun__liquidateRat()
  console.log(`Liquidate transaction sent: ${tx}`)
  await mud.waitForTransaction(tx)
  console.log("Rat liquidated successfully!")
  return tx
}

export async function runBot(config: Config) {
  logInfo("Starting Rattus Bot...")
  logInfo(`Chain ID: ${config.chainId}`)
  logInfo(`Server URL: ${config.serverUrl}`)
  logInfo(`Trip selector: ${config.tripSelector}`)
  logInfo(`Auto-respawn: ${config.autoRespawn}`)
  if (config.liquidateAtValue) {
    logInfo(`Liquidate at value: ${config.liquidateAtValue}`)
  }
  if (config.liquidateBelowValue) {
    logInfo(`Liquidate below value: ${config.liquidateBelowValue}`)
  }

  // Initialize Anthropic client if using Claude selector
  let anthropic: Anthropic | undefined
  if (config.tripSelector === "claude") {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey })
    logInfo("Claude API client initialized")
  }

  // Setup MUD
  logInfo("Setting up MUD connection...")
  const mud = await setupMud(config.privateKey, config.chainId, config.worldAddress)
  logSuccess("MUD setup complete!")

  // Wait a moment for sync to fully complete
  logInfo("Waiting for state sync...")
  await sleep(2000)

  const walletAddress = mud.walletClient.account.address
  const playerId = addressToId(walletAddress)
  logInfo(`Wallet address: ${walletAddress}`)
  logInfo(`Player ID: ${playerId}`)

  // Check if player exists (retry a few times in case sync is still catching up)
  logInfo("Checking player status...")
  let player = await retryUntilResult(() => getPlayer(mud, playerId), 5000, 500)

  if (!player) {
    logInfo("Player not found, spawning...")
    await spawn(mud, config.ratName)

    // Wait for player to appear in MUD state
    logInfo("Waiting for player to sync...")
    player = await retryUntilResult(() => getPlayer(mud, playerId), 10000, 500)

    if (!player) {
      throw new Error("Failed to create player - timeout waiting for sync")
    }
    logSuccess(`Player spawned: ${player.name}`)
  } else {
    logSuccess(`Player found: ${player.name}`)
  }

  // Check token allowance
  logInfo("Checking token allowance...")
  const gameConfig = getGameConfig(mud)
  const allowance = await getAllowance(mud, walletAddress)
  const requiredAllowance = BigInt(gameConfig.ratCreationCost) * BigInt(10 ** 18)

  if (allowance < requiredAllowance) {
    logWarning("Insufficient token allowance, approving max...")
    await approveMaxTokens(mud)
    logSuccess("Token allowance approved!")
  } else {
    logSuccess("Token allowance sufficient")
  }

  // Check for current rat
  logInfo("Checking rat status...")
  let rat: Rat | null = null
  let ratId = player.currentRat

  if (ratId) {
    rat = getRat(mud, ratId)
    if (rat && !rat.dead) {
      logSuccess(`Found live rat: ${rat.name} (balance: ${rat.balance})`)
    } else if (rat?.dead) {
      logWarning(`Rat ${rat.name} is dead`)
      rat = null
      ratId = null
    }
  }

  // Create rat if needed
  if (!rat) {
    logInfo(`Creating new rat: ${config.ratName}...`)
    await createRat(mud, config.ratName)

    // Wait for rat to appear
    logInfo("Waiting for rat to sync...")
    await sleep(3000) // Give the chain time to process

    // Re-fetch player to get the new currentRat
    player = getPlayer(mud, playerId)
    if (player?.currentRat) {
      ratId = player.currentRat
      rat = await retryUntilResult(() => getRat(mud, ratId!), 10000, 500)
    }

    if (!rat) {
      throw new Error("Failed to create rat - timeout waiting for sync")
    }
    logSuccess(`Rat created: ${rat.name} (balance: ${rat.balance})`)
  }

  // Main bot loop
  let tripCount = 0
  let startingBalance = rat.balance
  let startingRatName = rat.name

  // Track outcome history for learning (persists across respawns and bot restarts)
  const outcomeHistory: TripOutcomeHistory[] = loadOutcomeHistory()

  logInfo("Starting main loop...")
  logInfo("==========================================")

  while (true) {
    // Check if we should liquidate based on value threshold
    if (config.liquidateAtValue && rat) {
      const totalValue = getRatTotalValue(mud, rat)
      if (totalValue >= config.liquidateAtValue) {
        logSuccess(
          `Rat value (${totalValue}) reached liquidation threshold (${config.liquidateAtValue})!`
        )

        logStats({
          ratName: rat.name,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: totalValue
        })

        // Liquidate the rat
        await liquidateRat(mud)
        logSuccess("Rat liquidated! Creating new rat...")

        await createRat(mud, config.ratName)
        await sleep(3000)

        // Re-fetch player and rat
        player = getPlayer(mud, playerId)
        if (player?.currentRat) {
          ratId = player.currentRat
          rat = await retryUntilResult(() => getRat(mud, ratId!), 10000, 500)
        }

        if (!rat) {
          throw new Error("Failed to create new rat after liquidation")
        }

        logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`)
        startingBalance = rat.balance
        startingRatName = rat.name
        tripCount = 0
        continue
      }
    }

    // Check if we should liquidate because value fell too low
    if (config.liquidateBelowValue && rat) {
      const totalValue = getRatTotalValue(mud, rat)
      if (totalValue < config.liquidateBelowValue) {
        logWarning(`Rat value (${totalValue}) fell below threshold (${config.liquidateBelowValue})`)

        logStats({
          ratName: rat.name,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: totalValue
        })

        // Liquidate the rat
        await liquidateRat(mud)
        logInfo("Rat liquidated due to low value. Creating new rat...")

        await createRat(mud, config.ratName)
        await sleep(3000)

        // Re-fetch player and rat
        player = getPlayer(mud, playerId)
        if (player?.currentRat) {
          ratId = player.currentRat
          rat = await retryUntilResult(() => getRat(mud, ratId!), 10000, 500)
        }

        if (!rat) {
          throw new Error("Failed to create new rat after liquidation")
        }

        logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`)
        startingBalance = rat.balance
        startingRatName = rat.name
        tripCount = 0
        continue
      }
    }

    // Get available trips
    const trips = getAvailableTrips(mud)
    logInfo(`Found ${trips.length} available trips`)

    if (trips.length === 0) {
      logWarning("No trips available, waiting 10 seconds...")
      await sleep(10000)
      continue
    }

    // Filter trips that the rat can actually enter
    const enterableTrips = trips.filter(trip => canRatEnterTrip(mud, rat!, trip))
    logInfo(`${enterableTrips.length} trips are enterable with current rat value`)

    if (enterableTrips.length === 0) {
      logWarning("Rat value too low to enter any trips, waiting 10 seconds...")
      await sleep(10000)
      continue
    }

    // Select a trip (pass history for learning)
    const selection = await selectTrip(config, enterableTrips, rat!, anthropic, outcomeHistory)
    if (!selection) {
      logError("Failed to select a trip")
      await sleep(5000)
      continue
    }

    const { trip: selectedTrip, explanation } = selection

    tripCount++
    logTrip(tripCount, `Entering: "${selectedTrip.prompt.slice(0, 60)}..."`)
    logTrip(tripCount, `Trip balance: ${selectedTrip.balance}`)
    logInfo(`Selection reason: ${explanation}`)

    // Store rat total value before trip (balance + inventory)
    const totalValueBefore = getRatTotalValue(mud, rat!)

    // Enter the trip
    try {
      const outcome = await enterTrip(config.serverUrl, mud.walletClient, selectedTrip.id, rat!.id)

      // Log the story
      const logEntries: string[] = []
      if (outcome.log && outcome.log.length > 0) {
        console.log("")
        for (const entry of outcome.log) {
          console.log(`  ${entry.event}`)
          logEntries.push(entry.event)
        }
        console.log("")
      }

      // Check if rat died
      if (outcome.ratDead) {
        // Record outcome for history
        outcomeHistory.push({
          tripId: selectedTrip.id,
          tripPrompt: selectedTrip.prompt,
          totalValueBefore,
          totalValueAfter: 0,
          valueChange: -totalValueBefore,
          died: true,
          logSummary: logEntries.slice(0, 3).join(" | ")
        })
        saveOutcomeHistory(outcomeHistory)

        logDeath(rat!.name, tripCount)

        logStats({
          ratName: startingRatName,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: 0
        })

        if (config.autoRespawn) {
          logInfo("Auto-respawn enabled, creating new rat...")

          await createRat(mud, config.ratName)
          await sleep(3000)

          // Re-fetch player and rat
          player = getPlayer(mud, playerId)
          if (player?.currentRat) {
            ratId = player.currentRat
            rat = await retryUntilResult(() => getRat(mud, ratId!), 10000, 500)
          }

          if (!rat) {
            throw new Error("Failed to create new rat after death")
          }

          logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`)
          startingBalance = rat.balance
          startingRatName = rat.name
          tripCount = 0 // Reset trip count for new rat
        } else {
          logInfo("Auto-respawn disabled, exiting...")
          break
        }
      } else {
        // Refresh rat state
        await sleep(2000) // Wait for chain state to update
        rat = getRat(mud, rat!.id)
        if (rat) {
          const totalValueAfter = getRatTotalValue(mud, rat)
          const valueChange = totalValueAfter - totalValueBefore

          // Record outcome for history
          outcomeHistory.push({
            tripId: selectedTrip.id,
            tripPrompt: selectedTrip.prompt,
            totalValueBefore,
            totalValueAfter,
            valueChange,
            died: false,
            logSummary: logEntries.slice(0, 3).join(" | ")
          })
          saveOutcomeHistory(outcomeHistory)

          const changeStr = valueChange >= 0 ? `+${valueChange}` : `${valueChange}`
          const inventoryItems = getInventoryDetails(mud, rat)
          const inventoryStr =
            inventoryItems.length > 0
              ? `, Inventory: [${inventoryItems.map(i => `${i.name}(${i.value})`).join(", ")}]`
              : ""
          logRat(
            rat.name,
            `Balance: ${rat.balance}, Total Value: ${totalValueAfter} (${changeStr}), Trips: ${tripCount}${inventoryStr}`
          )
        }
      }

      // Small delay between trips
      await sleep(2000)
    } catch (error) {
      logError(`Failed to enter trip: ${error instanceof Error ? error.message : String(error)}`)
      await sleep(5000)
    }
  }

  logInfo("Bot stopped.")
}
