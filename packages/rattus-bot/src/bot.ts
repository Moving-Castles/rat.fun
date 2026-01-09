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
import {
  selectTrip,
  updateGraphWithOutcome,
  markTripDepleted,
  getRecommendedPath,
  getGraph
} from "./modules/trip-selector"
import { getGamePercentagesConfig } from "./modules/mud"
import { addressToId, sleep, retryUntilResult } from "./modules/utils"
import {
  logInfo,
  logSuccess,
  logWarning,
  logError,
  logTrip,
  logRat,
  logDeath,
  logStats,
  logSessionStats,
  logValueBar
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

  // Session-wide statistics
  let sessionTotalRats = 1
  let sessionTotalTrips = 0
  let sessionTotalProfitLoss = 0

  // Track outcome history for learning (persists across respawns and bot restarts)
  const outcomeHistory: TripOutcomeHistory[] = loadOutcomeHistory()

  // Track current path for graph strategy (trips taken by current rat)
  let currentPath: string[] = []

  // Get game percentages config for graph strategy
  const gamePercentagesConfig = getGamePercentagesConfig(mud)

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

        // Update session stats
        sessionTotalTrips += tripCount
        sessionTotalProfitLoss += totalValue - startingBalance

        logStats({
          ratName: rat.name,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: totalValue
        })
        logSessionStats({
          totalRats: sessionTotalRats,
          totalTrips: sessionTotalTrips,
          totalProfitLoss: sessionTotalProfitLoss
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
        sessionTotalRats++
        startingBalance = rat.balance
        startingRatName = rat.name
        tripCount = 0
        currentPath = [] // Reset path for new rat (graph strategy)
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
    const worldAddress = mud.worldContract.address
    const ratTotalValue = getRatTotalValue(mud, rat!)
    const inventoryItems = getInventoryDetails(mud, rat!)
    const inventoryNames = inventoryItems.map(i => i.name)

    const selection = await selectTrip({
      config,
      trips: enterableTrips,
      rat: rat!,
      ratTotalValue,
      anthropic,
      outcomeHistory,
      worldAddress,
      minRatValueToEnterPercent: gamePercentagesConfig.minRatValueToEnter,
      currentPath,
      inventory: inventoryNames
    })
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

    // Log planned route (graph strategy only)
    if (config.tripSelector === "graph") {
      try {
        const plannedRoute = await getRecommendedPath(
          ratTotalValue,
          inventoryNames,
          worldAddress,
          enterableTrips,
          5 // Look ahead 5 trips
        )
        if (plannedRoute.length > 0) {
          console.log("")
          logInfo("=== PLANNED ROUTE ===")
          let cumulativeEV = ratTotalValue
          for (let i = 0; i < plannedRoute.length; i++) {
            const step = plannedRoute[i]
            const tripData = enterableTrips.find(t => t.id === step.tripId)
            const prompt = tripData?.prompt?.slice(0, 40) || "Unknown"
            cumulativeEV += step.expectedValue
            const evSign = step.expectedValue >= 0 ? "+" : ""
            logInfo(
              `  ${i + 1}. "${prompt}..." (EV: ${evSign}${step.expectedValue.toFixed(0)}, cumulative: ${cumulativeEV.toFixed(0)})`
            )
          }
          logInfo("=====================")
          console.log("")
        }
      } catch (e) {
        // Route planning failed, continue without it
      }
    }

    // Track this trip in current path for graph strategy
    currentPath.push(selectedTrip.id)

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

      // Check if trip was depleted
      if (outcome.tripDepleted) {
        markTripDepleted(selectedTrip.id)
      }

      // Check if rat died
      if (outcome.ratDead) {
        // Record outcome for history
        const historyEntry = {
          tripId: selectedTrip.id,
          tripPrompt: selectedTrip.prompt,
          totalValueBefore,
          totalValueAfter: 0,
          valueChange: -totalValueBefore,
          died: true,
          logSummary: logEntries.slice(0, 3).join(" | ")
        }
        outcomeHistory.push(historyEntry)
        saveOutcomeHistory(outcomeHistory)

        // Update graph with outcome (for graph strategy learning)
        updateGraphWithOutcome(selectedTrip.id, {
          _id: "",
          _createdAt: new Date().toISOString(),
          tripId: selectedTrip.id,
          tripIndex: 0,
          ratId: rat!.id,
          ratName: rat!.name,
          playerId,
          playerName: player?.name || "",
          ratValueChange: -totalValueBefore,
          ratValue: 0,
          oldRatValue: totalValueBefore,
          newRatBalance: 0,
          oldRatBalance: rat!.balance,
          inventoryOnEntrance: inventoryItems.map(i => ({ id: "", name: i.name, value: i.value })),
          itemChanges: [],
          itemsLostOnDeath: inventoryItems.map(i => ({ id: "", name: i.name, value: i.value })),
          died: true,
          survived: false
        })

        logDeath(rat!.name, tripCount)

        // Update session stats
        sessionTotalTrips += tripCount
        sessionTotalProfitLoss += 0 - startingBalance

        logStats({
          ratName: startingRatName,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: 0
        })
        logSessionStats({
          totalRats: sessionTotalRats,
          totalTrips: sessionTotalTrips,
          totalProfitLoss: sessionTotalProfitLoss
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
          sessionTotalRats++
          startingBalance = rat.balance
          startingRatName = rat.name
          tripCount = 0 // Reset trip count for new rat
          currentPath = [] // Reset path for new rat (graph strategy)
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

          // Get updated inventory for logging and graph update
          const updatedInventoryItems = getInventoryDetails(mud, rat)

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

          // Update graph with outcome (for graph strategy learning)
          updateGraphWithOutcome(selectedTrip.id, {
            _id: "",
            _createdAt: new Date().toISOString(),
            tripId: selectedTrip.id,
            tripIndex: 0,
            ratId: rat.id,
            ratName: rat.name,
            playerId,
            playerName: player?.name || "",
            ratValueChange: valueChange,
            ratValue: totalValueAfter,
            oldRatValue: totalValueBefore,
            newRatBalance: rat.balance,
            oldRatBalance: totalValueBefore - inventoryItems.reduce((sum, i) => sum + i.value, 0),
            inventoryOnEntrance: inventoryItems.map(i => ({
              id: "",
              name: i.name,
              value: i.value
            })),
            itemChanges: [], // Would need to compare inventories to populate this
            itemsLostOnDeath: [],
            died: false,
            survived: true
          })

          const changeStr = valueChange >= 0 ? `+${valueChange}` : `${valueChange}`
          const inventoryStr =
            updatedInventoryItems.length > 0
              ? `, Inventory: [${updatedInventoryItems.map(i => `${i.name}(${i.value})`).join(", ")}]`
              : ""
          logRat(
            rat.name,
            `Balance: ${rat.balance}, Total Value: ${totalValueAfter} (${changeStr}), Trips: ${tripCount}${inventoryStr}`
          )
          logValueBar({
            currentValue: totalValueAfter,
            liquidateBelowValue: config.liquidateBelowValue,
            liquidateAtValue: config.liquidateAtValue
          })

          // Re-evaluate and log updated route after trip outcome (graph strategy only)
          if (config.tripSelector === "graph") {
            try {
              const updatedInventoryNames = updatedInventoryItems.map(i => i.name)
              const updatedTrips = getAvailableTrips(mud).filter(trip =>
                canRatEnterTrip(mud, rat!, trip)
              )
              const updatedRoute = await getRecommendedPath(
                totalValueAfter,
                updatedInventoryNames,
                worldAddress,
                updatedTrips,
                5
              )
              if (updatedRoute.length > 0) {
                console.log("")
                logInfo("=== UPDATED ROUTE (after outcome) ===")
                let cumulativeEV = totalValueAfter
                for (let i = 0; i < updatedRoute.length; i++) {
                  const step = updatedRoute[i]
                  const tripData = updatedTrips.find(t => t.id === step.tripId)
                  const prompt = tripData?.prompt?.slice(0, 40) || "Unknown"
                  cumulativeEV += step.expectedValue
                  const evSign = step.expectedValue >= 0 ? "+" : ""
                  logInfo(
                    `  ${i + 1}. "${prompt}..." (EV: ${evSign}${step.expectedValue.toFixed(0)}, cumulative: ${cumulativeEV.toFixed(0)})`
                  )
                }
                logInfo("=====================================")
                console.log("")
              }
            } catch (e) {
              // Route re-evaluation failed, continue without it
            }
          }
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
