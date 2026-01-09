<script lang="ts">
  import type { LayoutProps } from "./$types"
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  import { createLogger } from "$lib/modules/logger"
  import { initSound, cleanupSound } from "$lib/modules/sound"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { onMount, onDestroy, tick } from "svelte"
  import {
    initStaticContent,
    initTrips,
    initPlayerOutcomes,
    setPlayerIdStore,
    loadFeedHistory
  } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState, lightboxState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { environment as environmentStore } from "$lib/modules/network"
  import {
    cleanupDrawbridge,
    userAddress,
    getDrawbridge,
    isDrawbridgeInitialized
  } from "$lib/modules/drawbridge"
  import { playerId, playerTrips, nonDepletedTrips, trips } from "$lib/modules/state/stores"
  import { get } from "svelte/store"
  import { initOffChainSync, disconnectOffChainSync } from "$lib/modules/off-chain-sync"
  import { resetEntitiesInitialization } from "$lib/modules/chain-sync"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import {
    initLiquidationWatcher,
    cleanupLiquidationWatcher
  } from "$lib/modules/liquidation-watcher"

  // Components
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import TouristTrip from "$lib/components/TouristTrip/TouristTrip.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { ShaderGlobal, Lightbox, Toasts, ManageAllowanceModal, SEO } from "$lib/components/Shared"
  import { allowanceModalState, closeAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"
  import { sdk } from "@farcaster/miniapp-sdk"

  const logger = createLogger("[Layout]")

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = () => {
    // Get content from CMS
    // We do not wait, for faster loading time...
    initStaticContent($publicNetwork.worldAddress)
    // HACK: Set playerId store for trip notifications (avoids circular dependency)
    setPlayerIdStore(playerId)
    // Loading done. Set the UI state to spawning
    UIState.set(UI.SPAWNING)
  }

  // Called when loading completes on a trip page without full auth (tourist mode)
  const loadedAsTourist = async () => {
    logger.log("loadedAsTourist() called")
    // Get content from CMS (needed for trip data)
    initStaticContent($publicNetwork.worldAddress)
    // Skip spawn flow, go directly to tourist view
    UIState.set(UI.TOURIST)
  }

  const spawned = async () => {
    logger.log("spawned() called")
    // Initialize ERC20 listener (centralized here for all scenarios)
    initErc20Listener()

    // =========================================================================
    // ROBUST STORE READINESS CHECK
    // =========================================================================
    // We need to ensure derived stores have recomputed before reading from them.
    // Race conditions can occur when:
    // 1. playerAddress was just set but playerId hasn't derived yet
    // 2. entities were updated but trips/playerTrips haven't derived yet
    // 3. tick() was called but derived stores are still computing
    //
    // We use a retry loop with comprehensive validation to guarantee readiness.
    // =========================================================================

    const MAX_RETRIES = 10
    const RETRY_DELAY_MS = 20
    const ZERO_PLAYER_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"

    let finalPlayerTripIds: string[] = []
    let finalActiveTripIds: string[] = []
    let finalRelevantTripIds: string[] = []
    let storesReady = false

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // Flush Svelte reactivity
      await tick()

      // Read current store values
      const currentPlayerId = get(playerId)
      const currentTrips = get(trips)
      const currentPlayerTrips = get(playerTrips)
      const currentNonDepletedTrips = get(nonDepletedTrips)

      const tripsCount = Object.keys(currentTrips).length
      const playerTripsCount = Object.keys(currentPlayerTrips).length
      const nonDepletedTripsCount = Object.keys(currentNonDepletedTrips).length
      const isPlayerIdValid = currentPlayerId !== ZERO_PLAYER_ID

      logger.log(`Store readiness check (attempt ${attempt}/${MAX_RETRIES}):`, {
        playerId: currentPlayerId.slice(0, 10) + "...",
        isPlayerIdValid,
        tripsCount,
        playerTripsCount,
        nonDepletedTripsCount
      })

      // Check if stores are in a valid state
      // Valid states:
      // 1. playerId is valid AND we have trips data (normal case)
      // 2. playerId is valid AND trips is empty (new player with no trips - valid)
      // Invalid states:
      // 1. playerId is still the zero address (playerAddress hasn't propagated)
      // 2. trips has data but playerTrips is empty when it shouldn't be

      if (!isPlayerIdValid) {
        logger.warn(`playerId not ready (attempt ${attempt}), waiting...`)
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
      }

      // playerId is valid - now check if derived stores have caught up
      // If we have trips but playerTrips is empty, the derived store may not have recomputed
      if (tripsCount > 0 && playerTripsCount === 0 && nonDepletedTripsCount === 0) {
        logger.warn(
          `Potential race: trips=${tripsCount} but derived stores empty (attempt ${attempt})`
        )
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
      }

      // Stores appear ready
      finalPlayerTripIds = Object.keys(currentPlayerTrips)
      finalActiveTripIds = Object.keys(currentNonDepletedTrips)
      finalRelevantTripIds = [...new Set([...finalActiveTripIds, ...finalPlayerTripIds])]
      storesReady = true

      logger.log(`Stores ready after ${attempt} attempt(s):`, {
        playerTripIds: finalPlayerTripIds.length,
        activeTripIds: finalActiveTripIds.length,
        relevantTripIds: finalRelevantTripIds.length
      })
      break
    }

    if (!storesReady) {
      logger.error("CRITICAL: Stores not ready after max retries. Proceeding with current values.")
      // Use whatever we have
      finalPlayerTripIds = Object.keys(get(playerTrips))
      finalActiveTripIds = Object.keys(get(nonDepletedTrips))
      finalRelevantTripIds = [...new Set([...finalActiveTripIds, ...finalPlayerTripIds])]
    }

    // Final validation log
    logger.log("Final trip IDs for CMS query:", {
      playerTripIds: finalPlayerTripIds.length,
      activeTripIds: finalActiveTripIds.length,
      relevantTripIds: finalRelevantTripIds.length,
      storesReady
    })

    // Load trips and outcomes from CMS
    initTrips($publicNetwork.worldAddress, finalRelevantTripIds)
    initPlayerOutcomes($publicNetwork.worldAddress, finalPlayerTripIds)

    logger.log("loading history", $publicNetwork.worldAddress)
    // Load recent trips/outcomes for operator feed history (non-blocking)
    loadFeedHistory($publicNetwork.worldAddress)

    // Initialize liquidation watcher to track onchain trip liquidations
    initLiquidationWatcher()

    UIState.set(UI.READY)
  }

  // Detect wallet disconnection and navigate back to spawn
  // NOTE: We subscribe to $userAddress for reactivity, but verify against
  // drawbridge.getState() to avoid false positives from store sync delays
  $effect(() => {
    // Only act when in READY state (not during initial load or spawn flow)
    if ($UIState !== UI.READY) return

    // If user address becomes null, verify it's a real disconnect
    if ($userAddress === null) {
      // Double-check directly from drawbridge to avoid store race conditions
      if (isDrawbridgeInitialized()) {
        const state = getDrawbridge().getState()
        if (state.userAddress !== null) {
          // Store says null but drawbridge says connected - it's a store sync delay, ignore
          logger.log("Store shows null but drawbridge has address, ignoring")
          return
        }
      }

      logger.log("Wallet disconnected externally, navigating back to spawn")
      // Reset entities initialization so it will reinitialize for the new wallet
      resetEntitiesInitialization()
      // Clean up liquidation watcher
      cleanupLiquidationWatcher()
      UIState.set(UI.SPAWNING)
    }
  })

  // Initialize/disconnect websocket based on UI state and playerId
  $effect(() => {
    const currentPlayerId = $playerId
    const isReady = $UIState === UI.READY
    const environment = $environmentStore

    // Connect when UI is ready and we have a valid playerId
    if (
      isReady &&
      currentPlayerId &&
      currentPlayerId !== "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      // logger.log("Initializing off-chain sync for player:", currentPlayerId)
      initOffChainSync(environment, currentPlayerId)
    }

    // Disconnect when leaving ready state
    return () => {
      if (isReady) {
        // logger.log("Disconnecting off-chain sync")
        disconnectOffChainSync()
      }
    }
  })

  // Initialize Sentry
  if (browser && !import.meta.env.DEV) {
    initializeSentry()
  }

  onMount(async () => {
    initSound()

    // Signal readiness to base (farcaster) mini app framework
    sdk.actions.ready()
  })

  onDestroy(() => {
    // Clean up drawbridge
    cleanupDrawbridge()
    cleanupSound()
    // Clean up liquidation watcher
    cleanupLiquidationWatcher()

    // Clean up global shader manager when the app unmounts
    shaderManager.destroy()
  })
</script>

<svelte:window />

<SEO prependTitle="" />

<div class="bg">
  {#if $UIState === UI.LOADING}
    <Loading environment={$environmentStore} {loaded} {loadedAsTourist} />
  {:else if $UIState === UI.TOURIST}
    <TouristTrip />
  {:else if $UIState === UI.SPAWNING}
    <Spawn {spawned} />
  {:else}
    {@render children?.()}
  {/if}

  {#if browser}
    <ShaderGlobal />
  {/if}
</div>

<Toasts />

{#if lightboxState.isOpen}
  <Lightbox src={lightboxState.src} alt={lightboxState.alt} onClose={() => lightboxState.close()} />
{/if}

{#if allowanceModalState.isOpen}
  <ManageAllowanceModal
    onclose={closeAllowanceModal}
    warningMessage={allowanceModalState.warningMessage}
  />
{/if}

<style lang="scss">
  .bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-background);
    background: var(--background);
  }
</style>
