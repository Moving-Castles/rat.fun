<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte"
  import { page } from "$app/state"
  import { get } from "svelte/store"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities, hydrateFromServer, fetchTrips } from "$lib/modules/chain-sync"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateLoadingOutput } from "$lib/components/Loading/loadingOutput"
  import { playSound } from "$lib/modules/sound"
  import { publicNetwork, environment as envStore } from "$lib/modules/network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { addressToId } from "$lib/modules/utils"
  import { entities } from "$lib/modules/state/stores"

  import { gsap } from "gsap"

  // Wallet setup imports
  import { setupWalletNetwork } from "@ratfun/common/mud"
  import { ENVIRONMENT, WALLET_TYPE } from "@ratfun/common/basic-network"
  import { initializeDrawbridge, getDrawbridge } from "$lib/modules/drawbridge"
  import { initWalletNetwork } from "$lib/initWalletNetwork"

  const {
    environment,
    loaded = () => {},
    loadedAsTourist = () => {}
  }: {
    environment: ENVIRONMENT
    loaded: () => void
    loadedAsTourist: () => void
  } = $props()

  // Check if we're on a trip page route
  const isOnTripPage = () => page.route.id === "/(main)/(game)/[tripId]"

  let typer = $state<{ stop: () => void }>()

  // Elements
  let loadingElement: HTMLDivElement
  let terminalBoxElement: HTMLDivElement
  let logoElement: HTMLDivElement

  // ============================================================================
  // ANIMATION
  // ============================================================================

  const strobeColors = ["#ff0000", "#00ff00", "#0000ff"]

  function animateOut(): Promise<void> {
    return new Promise(resolve => {
      const tl = gsap.timeline()

      tl.to(terminalBoxElement, {
        opacity: 0,
        duration: 0
      })

      tl.call(() => {
        playSound({ category: "ratfunUI", id: "strobe" })
      })

      // Create strobe effect: 16 cycles of 1/60s (1 frame each at 60fps)
      for (let i = 0; i < 16; i++) {
        tl.to(loadingElement, {
          background: strobeColors[i % strobeColors.length],
          duration: 0,
          delay: 1 / 60
        })
        tl.to(loadingElement, {
          background: "transparent",
          duration: 0,
          delay: 1 / 60
        })
      }

      tl.to(logoElement, {
        opacity: 1,
        duration: 0,
        delay: 0
      })

      tl.to(loadingElement, {
        background: "black",
        duration: 0,
        delay: 5 / 60
      })

      tl.call(() => {
        resolve()
      })
    })
  }

  // ============================================================================
  // MAIN LOADING SEQUENCE
  // ============================================================================

  onMount(async () => {
    // Start terminal typer for visual feedback
    if (terminalBoxElement) {
      typer = terminalTyper(terminalBoxElement, generateLoadingOutput())
    }

    // -------------------------------------------------------------------------
    // Step 1: Initialize public network (MUD sync + global config)
    // -------------------------------------------------------------------------
    // Sets up MUD layer and fetches global config from server (if enabled).
    // Global config populates entities["0x"] with ExternalAddressesConfig, etc.
    // Returns publicClient and transport for reuse by drawbridge.
    console.log("[Loading] Initializing public network...")
    const { publicClient, transport, worldAddress, configFromServer } = await initPublicNetwork({
      environment,
      url: page.url
    })

    // -------------------------------------------------------------------------
    // Step 2: Initialize drawbridge
    // -------------------------------------------------------------------------
    // Drawbridge manages wallet connection and session keys.
    // It internally reads wagmi localStorage to restore previous connections.
    // Reuses the publicClient from MUD to avoid duplicate RPC polling.
    console.log("[Loading] Initializing drawbridge...")
    await initializeDrawbridge({
      publicClient,
      transport,
      worldAddress
    })

    // -------------------------------------------------------------------------
    // Step 3: Check wallet state and initialize accordingly
    // -------------------------------------------------------------------------
    // After drawbridge init, we have three possible scenarios:
    //
    // SCENARIO A: Wallet connected + session ready
    //   → Full initialization: wallet, entities, ERC20 listener
    //   → User goes straight to game (Spawn exits immediately)
    //
    // SCENARIO B: Wallet connected + NO session
    //   → Partial initialization: entities only (for filtering)
    //   → Wallet/ERC20 initialized later in Spawn after session setup
    //
    // SCENARIO C: No wallet connected
    //   → No initialization here
    //   → Everything initialized in Spawn flow
    //
    const drawbridge = getDrawbridge()
    const drawbridgeState = drawbridge.getState()
    const network = get(publicNetwork)
    const env = get(envStore)

    if (drawbridgeState.isReady && drawbridgeState.sessionClient && drawbridgeState.userAddress) {
      // -----------------------------------------------------------------------
      // SCENARIO A: Wallet + Session ready
      // -----------------------------------------------------------------------
      // Returning user with full session. Initialize everything.
      console.log("[Loading] Scenario A: Wallet + session ready")
      console.log("[Loading] Address:", drawbridgeState.userAddress)

      // Initialize wallet network (sets walletNetwork, playerAddress stores)
      const wallet = setupWalletNetwork(network, drawbridgeState.sessionClient)
      initWalletNetwork(wallet, drawbridgeState.userAddress, WALLET_TYPE.DRAWBRIDGE)

      // Try server hydration for player-specific data
      const playerId = addressToId(drawbridgeState.userAddress)

      if (configFromServer) {
        // Server hydration enabled - fetch player data
        const hydrationResult = await hydrateFromServer(playerId, env)

        if (hydrationResult) {
          // Merge server entities with existing (keep worldObject from config)
          entities.update(current => ({
            ...current,
            ...hydrationResult.entities
          }))
          console.log("[Loading] Player hydration succeeded")

          // Check for stale hydration data
          try {
            const currentBlock = await network.publicClient.getBlockNumber()
            const hydrationBlock = hydrationResult.blockNumber
            const blocksBehind = currentBlock - hydrationBlock
            if (blocksBehind > 10n) {
              console.warn(
                `[Loading] Hydration data is ${blocksBehind} blocks behind (hydration: ${hydrationBlock}, current: ${currentBlock})`
              )
            } else {
              console.log(`[Loading] Hydration data is fresh (${blocksBehind} blocks behind)`)
            }
          } catch (error) {
            console.warn("[Loading] Could not check hydration staleness:", error)
          }

          // Fetch trips - must complete before spawned() runs so trip IDs are available for CMS queries
          const tripsResult = await fetchTrips(playerId, env)
          if (tripsResult) {
            console.log(
              "[Loading] fetchTrips completed, updating entities store with",
              Object.keys(tripsResult.entities).length,
              "trips"
            )
            entities.update(current => ({
              ...current,
              ...tripsResult.entities
            }))
            // Flush reactivity so derived stores (trips, nonDepletedTrips, playerTrips) update
            await tick()
            console.log("[Loading] Entities store updated with trips, tick completed")
          } else {
            console.log("[Loading] fetchTrips completed but returned null")
          }
        }
      }

      // Initialize entities with player filtering (sets up subscriptions)
      await initEntities({ activePlayerId: playerId })
    } else if (drawbridgeState.userAddress) {
      // -----------------------------------------------------------------------
      // SCENARIO B: Wallet connected, but NO session
      // -----------------------------------------------------------------------
      // User's wallet was restored from localStorage, but session expired or
      // was never created. They'll need to set up session in Spawn flow.
      //
      // We initialize entities here (with player filtering) so the game state
      // is ready. Wallet network and ERC20 listener will be initialized after
      // session setup in Spawn.
      //
      // EXCEPTION: If on trip page, show tourist view instead of Spawn.
      console.log("[Loading] Scenario B: Wallet connected, no session")
      console.log("[Loading] Address:", drawbridgeState.userAddress)

      const playerId = addressToId(drawbridgeState.userAddress)
      await initEntities({ activePlayerId: playerId })

      if (isOnTripPage()) {
        console.log("[Loading] On trip page → tourist mode")
        if (typer?.stop) typer.stop()
        await animateOut()
        loadedAsTourist()
        return
      }
    } else {
      // -----------------------------------------------------------------------
      // SCENARIO C: No wallet connected
      // -----------------------------------------------------------------------
      // New user or cleared localStorage. Everything will be initialized
      // in the Spawn flow after they connect wallet and set up session.
      //
      // EXCEPTION: If on trip page, show tourist view instead of Spawn.
      // Initialize entities without player filtering so all trips are visible.
      console.log("[Loading] Scenario C: No wallet connected")

      if (isOnTripPage()) {
        console.log("[Loading] On trip page → tourist mode")
        // Initialize entities without player ID - syncs ALL entities (no filtering)
        // This should be optimized...
        await initEntities()
        if (typer?.stop) typer.stop()
        await animateOut()
        loadedAsTourist()
        return
      }
    }

    // -------------------------------------------------------------------------
    // Step 4: Finish loading sequence
    // -------------------------------------------------------------------------
    if (typer?.stop) {
      typer.stop()
    }

    await animateOut()
    loaded()
  })

  onDestroy(() => {
    if (typer?.stop) {
      typer.stop()
    }
  })
</script>

<div class="loading" bind:this={loadingElement}>
  <div class="mc-logo" bind:this={logoElement}>
    <img src="/images/logo.png" alt={UI_STRINGS.authorFullTitle} />
  </div>
  <div class="terminal-box" bind:this={terminalBoxElement}></div>
</div>

<style lang="scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    width: 100dvw;
    height: 100dvh;
    z-index: var(--z-top);
    user-select: none;

    .terminal-box {
      font-size: var(--font-size-normal);
      width: 100%;
      height: 100%;
      max-width: 800px;
      text-align: left;
      padding: 20px;
      padding-top: 0;
      overflow-x: hidden;
      overflow-wrap: break-word;

      @media (max-width: 800px) {
        padding: 10px;
        font-size: var(--font-size-small);
        max-width: 100dvw;
      }
    }

    .mc-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      opacity: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
</style>
