<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { page } from "$app/state"
  import { fade } from "svelte/transition"

  import { WALLET_TYPE } from "$lib/mud/enums"

  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { sessionClient, status, DrawbridgeStatus, isSessionReady } from "$lib/modules/drawbridge"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { initEntities, isEntitiesInitialized } from "$lib/modules/chain-sync"
  import { addressToId } from "$lib/modules/utils"

  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"
  import {
    WelcomeScreen,
    Introduction,
    ConnectWalletForm,
    SessionSetup,
    SettingUp,
    SpawnForm,
    Spawning,
    Done,
    Error
  } from "$lib/components/Spawn"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { Marquee } from "$lib/components/Shared"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  /*
   *  Initial state determination based on:
   *  - walletConnected (wallet address available)
   *  - sessionReady (for Drawbridge: session is ready, for Burner: always true)
   *  - spawned (player already spawned in the game)
   *
   *  +---+----------------+-------------+---------+------------------+
   *  |   | walletConnected| sessionReady| spawned | Initial State    |
   *  +---+----------------+-------------+---------+------------------+
   *  | 0 |     false      |    false    |  false  | WELCOME_SCREEN   |
   *  | 1 |     false      |    false    |  true   | Impossible       |
   *  | 2 |     false      |    true     |  false  | Impossible       |
   *  | 3 |     false      |    true     |  true   | Impossible       |
   *  | 4 |     true       |    false    |  false  | SESSION_SETUP    |
   *  | 5 |     true       |    false    |  true   | SESSION_SETUP    |
   *  | 6 |     true       |    true     |  false  | INTRODUCTION     |
   *  | 7 |     true       |    true     |  true   | DIRECT TO GAME   |
   *  +---+----------------+-------------+---------+------------------+
   *
   *  Note: DONE state is reached only through normal flow (SPAWNING → DONE)
   *        Scenario 7 exits immediately without showing any UI
   */

  function determineInitialState(): SPAWN_STATE {
    console.log("[Spawn] Determining initial state, walletType:", walletType)

    if (walletType === WALLET_TYPE.BURNER) {
      const wallet = setupBurnerWalletNetwork($publicNetwork)
      const walletConnected = !!wallet.walletClient?.account.address
      const isSpawned = walletConnected
        ? initWalletNetwork(wallet, wallet.walletClient.account.address, WALLET_TYPE.BURNER)
        : false

      console.log("[Spawn] Burner wallet status:", { walletConnected, isSpawned })

      // Scenario 0: No wallet connected -> WELCOME_SCREEN
      if (!walletConnected) {
        console.log("[Spawn] Scenario 0: No wallet connected → WELCOME_SCREEN")
        return SPAWN_STATE.WELCOME_SCREEN
      }

      // Scenario 7: Wallet connected, session ready (always for burner), spawned -> exit flow
      if (
        isSpawned ||
        (page.route.id === "/(main)/(game)/[tripId]" && !page.url.searchParams.has("spawn"))
      ) {
        console.log("[Spawn] Scenario 7: Already spawned → exiting flow (no UI)")
        spawned()
        return SPAWN_STATE.INIT // No state transition, just exit
      }

      // Scenario 6: Wallet connected, session ready (always for burner), not spawned -> INTRODUCTION
      console.log("[Spawn] Scenario 6: Wallet connected, not spawned → INTRODUCTION")
      return SPAWN_STATE.INTRODUCTION
    } else {
      // DRAWBRIDGE
      const walletConnected =
        $status !== DrawbridgeStatus.DISCONNECTED && $status !== DrawbridgeStatus.UNINITIALIZED
      const sessionReady = $isSessionReady

      console.log("[Spawn] Drawbridge wallet status:", {
        status: $status,
        walletConnected,
        sessionReady
      })

      // Scenario 0: No wallet connected -> WELCOME_SCREEN
      if (!walletConnected) {
        console.log("[Spawn] Scenario 0: No wallet connected → WELCOME_SCREEN")
        return SPAWN_STATE.WELCOME_SCREEN
      }

      // Scenario 4 & 5: Wallet connected but session not ready -> SESSION_SETUP
      if (!sessionReady) {
        console.log("[Spawn] Scenario 4/5: Wallet connected, session not ready → SESSION_SETUP")
        return SPAWN_STATE.SESSION_SETUP
      }

      // Session is ready - ensure entities are initialized before checking spawn status
      if ($sessionClient) {
        const playerId = addressToId($sessionClient.userAddress)
        if (!isEntitiesInitialized(playerId)) {
          console.log("[Spawn] Initializing entities for drawbridge user:", playerId)
          initEntities({ activePlayerId: playerId })
        }

        const wallet = setupWalletNetwork($publicNetwork, $sessionClient)
        const isSpawned = initWalletNetwork(wallet, $sessionClient.userAddress, walletType)

        // Scenario 7: Wallet connected, session ready, spawned -> exit flow
        if (isSpawned) {
          console.log("[Spawn] Scenario 7: Already spawned → exiting flow (no UI)")
          spawned()
          return SPAWN_STATE.INIT // No state transition, just exit
        }
      }

      // Scenario 6: Wallet connected, session ready, not spawned -> INTRODUCTION
      console.log("[Spawn] Scenario 6: Wallet connected, session ready, not spawned → INTRODUCTION")
      return SPAWN_STATE.INTRODUCTION
    }
  }

  let initialized = $state(false)

  // Wait for drawbridge stores to settle before determining initial state
  $effect(() => {
    // For Drawbridge, wait until status is no longer UNINITIALIZED
    // This means the stores have been updated with the actual connection state
    if (walletType === WALLET_TYPE.DRAWBRIDGE && $status === DrawbridgeStatus.UNINITIALIZED) {
      console.log("[Spawn] Waiting for drawbridge stores to initialize...")
      return
    }

    // Only initialize once
    if (initialized) return
    initialized = true

    console.log("[Spawn] Stores ready, determining initial state")

    // Reset state machine to INIT
    spawnState.state.reset()

    // Determine initial state and transition
    const initialState = determineInitialState()
    console.log("[Spawn] Initial state determined:", initialState)

    // Only transition if we have a valid target state (not INIT for fast-track)
    if (initialState !== SPAWN_STATE.INIT) {
      spawnState.state.transitionTo(initialState)
    }
  })

  // Check if player is already spawned when reaching certain states
  $effect(() => {
    const currentState = spawnState.state.current

    // Skip checks if not initialized yet
    if (!initialized) return

    // Check when reaching SESSION_SETUP: if session is already ready, skip this screen
    if (currentState === SPAWN_STATE.SESSION_SETUP) {
      if (walletType === WALLET_TYPE.DRAWBRIDGE && $isSessionReady && $sessionClient) {
        // Ensure entities are initialized before checking spawn status
        const playerId = addressToId($sessionClient.userAddress)
        if (!isEntitiesInitialized(playerId)) {
          console.log("[Spawn] SESSION_SETUP: Initializing entities for:", playerId)
          initEntities({ activePlayerId: playerId })
        }

        const wallet = setupWalletNetwork($publicNetwork, $sessionClient)
        const isSpawned = initWalletNetwork(wallet, $sessionClient.userAddress, walletType)

        if (isSpawned) {
          console.log("[Spawn] At SESSION_SETUP but already spawned → fast-tracking to game")
          spawned()
          return
        }

        // Session ready but not spawned → skip to INTRODUCTION
        console.log("[Spawn] At SESSION_SETUP but session ready → skipping to INTRODUCTION")
        spawnState.state.transitionTo(SPAWN_STATE.INTRODUCTION)
      }
    }

    // Check when reaching INTRODUCTION: if already spawned, fast-track
    // Introduction should only be shown to users who are actually spawning (not yet spawned)
    if (currentState === SPAWN_STATE.INTRODUCTION) {
      if (walletType === WALLET_TYPE.BURNER) {
        const wallet = setupBurnerWalletNetwork($publicNetwork)
        if (wallet.walletClient?.account.address) {
          const isSpawned = initWalletNetwork(
            wallet,
            wallet.walletClient.account.address,
            WALLET_TYPE.BURNER
          )

          if (isSpawned) {
            console.log("[Spawn] At INTRODUCTION but already spawned → fast-tracking to game")
            spawned()
          }
        }
      } else if ($sessionClient) {
        // Ensure entities are initialized before checking spawn status
        const playerId = addressToId($sessionClient.userAddress)
        if (!isEntitiesInitialized(playerId)) {
          console.log("[Spawn] INTRODUCTION: Initializing entities for:", playerId)
          initEntities({ activePlayerId: playerId })
        }

        const wallet = setupWalletNetwork($publicNetwork, $sessionClient)
        const isSpawned = initWalletNetwork(wallet, $sessionClient.userAddress, walletType)

        if (isSpawned) {
          console.log("[Spawn] At INTRODUCTION but already spawned → fast-tracking to game")
          spawned()
        }
      }
    }
  })

  onMount(async () => {
    console.log("[Spawn] Component mounted")

    // HACK
    // When already spawned we are passing through here quickly
    // And music might be started but onDestroy is not called
    // Only start music if the UI state has not already changed from SPAWNING
    await new Promise(resolve => setTimeout(resolve, 500))
    if ($UIState === UI.SPAWNING) {
      backgroundMusic.play({ category: "ratfunMusic", id: "spawn", loop: true })
      shaderManager.setShader("clouds", true)
    }
  })

  onDestroy(() => {
    backgroundMusic.stop()
  })
</script>

<div class="container">
  <div class="marquee-container top" in:fade|global={{ duration: 200, delay: 1000 }}>
    <Marquee speed={5} numberOfCopies={10} direction="left">
      <p class="marquee-text">{UI_STRINGS.topMarqueeText}</p>
    </Marquee>
  </div>

  <div class="marquee-container bottom" in:fade|global={{ duration: 200, delay: 1000 }}>
    <Marquee speed={5} numberOfCopies={10} direction="right">
      <p class="marquee-text">{UI_STRINGS.bottomMarqueeText}</p>
    </Marquee>
  </div>

  <div class="content">
    {#if spawnState.state.current === SPAWN_STATE.WELCOME_SCREEN}
      <WelcomeScreen />
    {:else if spawnState.state.current === SPAWN_STATE.INTRODUCTION}
      <Introduction />
    {:else if spawnState.state.current === SPAWN_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if spawnState.state.current === SPAWN_STATE.SESSION_SETUP}
      <SessionSetup />
    {:else if spawnState.state.current === SPAWN_STATE.SETTING_UP_SESSION}
      <SettingUp />
    {:else if spawnState.state.current === SPAWN_STATE.SPAWN_FORM}
      <SpawnForm />
    {:else if spawnState.state.current === SPAWN_STATE.SPAWNING}
      <Spawning />
    {:else if spawnState.state.current === SPAWN_STATE.DONE}
      <Done {spawned} />
    {:else if spawnState.state.current === SPAWN_STATE.ERROR}
      <Error />
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    width: 100dvw;
    height: 100dvh;
    color: white;
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-normal);
    position: relative;

    .content {
      position: relative;
      z-index: 1;
    }

    .marquee-container {
      position: absolute;
      left: 0;
      width: 100%;
      height: 40px;
      z-index: 1;
      background: rgba(0, 0, 0, 0.5);
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      text-transform: uppercase;

      .marquee-text {
        padding: 0;
        margin: 0;
        height: 40px;
        line-height: 40px;
      }

      &.top {
        top: 0;
      }

      &.bottom {
        bottom: 0;
      }
    }
  }
</style>
