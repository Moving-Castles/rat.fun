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
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { initEntities, isEntitiesInitialized } from "$lib/modules/chain-sync"
  import { addressToId } from "$lib/modules/utils"

  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import {
    Introduction,
    ConnectWalletForm,
    Allowance,
    AllowanceLoading,
    Session,
    SessionLoading,
    SessionAndSpawn,
    SessionAndSpawnLoading,
    SpawnComponent,
    SpawnLoading,
    Done,
    Error
  } from "$lib/components/Spawn"
  import {
    spawnState,
    SPAWN_STATE,
    determineNextState,
    type FlowContext
  } from "$lib/components/Spawn/state.svelte"
  import { checkHasAllowance } from "$lib/components/Spawn/flowContext"
  import { Marquee } from "$lib/components/Shared"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  /*
   *  Initial state determination based on:
   *  - walletConnected (wallet address available)
   *  - sessionReady (for Drawbridge: session is ready, for Burner: always true)
   *  - hasAllowance (user has approved allowance > 100 tokens)
   *  - spawned (player already spawned in the game)
   *
   *  +----+----------------+-------------+--------------+---------+-------------------+
   *  |    | walletConnected| sessionReady| hasAllowance | spawned | Initial State     |
   *  +----+----------------+-------------+--------------+---------+-------------------+
   *  |  0 |     false      |    false    |    false     |  false  | CONNECT_WALLET    |
   *  |  1 |     false      |    false    |    false     |  true   | CONNECT_WALLET    |
   *  |  2 |     false      |    false    |    true      |  false  | CONNECT_WALLET    |
   *  |  3 |     false      |    false    |    true      |  true   | CONNECT_WALLET    |
   *  |  4 |     false      |    true     |    false     |  false  | CONNECT_WALLET    |
   *  |  5 |     false      |    true     |    false     |  true   | CONNECT_WALLET    |
   *  |  6 |     false      |    true     |    true      |  false  | CONNECT_WALLET    |
   *  |  7 |     false      |    true     |    true      |  true   | CONNECT_WALLET    |
   *  |  8 |     true       |    false    |    false     |  false  | INTRODUCTION      |
   *  |  9 |     true       |    false    |    false     |  true   | ALLOWANCE         |
   *  | 10 |     true       |    false    |    true      |  false  | SESSION_AND_SPAWN |
   *  | 11 |     true       |    false    |    true      |  true   | SESSION           |
   *  | 12 |     true       |    true     |    false     |  false  | ALLOWANCE         |
   *  | 13 |     true       |    true     |    false     |  true   | ALLOWANCE         |
   *  | 14 |     true       |    true     |    true      |  false  | SPAWN             |
   *  | 15 |     true       |    true     |    true      |  true   | EXIT_FLOW         |
   *  +----+----------------+-------------+--------------+---------+-------------------+
   *
   *  Note:
   *        - Scenario 0 is a new user flow
   *        - Scenarios 1 to 7 are not possible be cause we do not have a wallet connected
   *        - Scenario 11 is returning user who for some reason does not have a session (new browser, cleared cache, etc.)
   *        - Scenario 12 is returning user who has revoked allowance
   *        - Scenario 15 is a fully setup returning user, exits immediately without showing any UI
   *        - hasAllowance = allowance > 100 tokens
   *        - DONE state is reached only through normal flow (SPAWN_AND_SESSION__LOADING → DONE)
   */

  /**
   * Build the flow context for initial state determination.
   * This is slightly different from buildFlowContext in flowContext.ts because
   * it handles additional edge cases during initial load (e.g., page route checks,
   * entity initialization for drawbridge).
   */
  async function buildInitialFlowContext(): Promise<FlowContext> {
    console.log("[Spawn] Building initial flow context, walletType:", walletType)

    if (walletType === WALLET_TYPE.BURNER) {
      const wallet = setupBurnerWalletNetwork($publicNetwork)
      const walletConnected = !!wallet.walletClient?.account.address
      const walletAddress = wallet.walletClient?.account.address

      if (!walletConnected || !walletAddress) {
        return {
          walletConnected: false,
          sessionReady: false,
          hasAllowance: false,
          isSpawned: false
        }
      }

      const isSpawned = initWalletNetwork(wallet, walletAddress, WALLET_TYPE.BURNER)
      const hasAllowance = await checkHasAllowance(walletAddress)

      return {
        walletConnected: true,
        sessionReady: true, // Burner wallet always has session ready
        hasAllowance,
        isSpawned
      }
    } else {
      // DRAWBRIDGE - read directly from instance to avoid store timing issues
      const drawbridge = getDrawbridge()
      const state = drawbridge.getState()

      const walletConnected = !!state.userAddress
      const sessionReady = state.isReady
      const walletAddress = state.userAddress
      const client = state.sessionClient

      console.log("[Spawn] Drawbridge state:", {
        walletConnected,
        sessionReady,
        walletAddress,
        hasSessionClient: !!client
      })

      if (!walletConnected) {
        return {
          walletConnected: false,
          sessionReady: false,
          hasAllowance: false,
          isSpawned: false
        }
      }

      const hasAllowance = walletAddress ? await checkHasAllowance(walletAddress) : false

      // Without session, we can't easily check spawn status - assume not spawned
      if (!sessionReady) {
        return {
          walletConnected: true,
          sessionReady: false,
          hasAllowance,
          isSpawned: false // Assume not spawned without session
        }
      }

      // Session is ready - check spawn status
      let isSpawned = false
      if (client && walletAddress) {
        // Ensure entities are initialized before checking spawn status
        const playerId = addressToId(client.userAddress)
        if (!isEntitiesInitialized(playerId)) {
          console.log("[Spawn] Initializing entities for drawbridge user:", playerId)
          initEntities({ activePlayerId: playerId })
        }

        const wallet = setupWalletNetwork($publicNetwork, client)
        isSpawned = initWalletNetwork(wallet, client.userAddress, walletType)
      }

      return {
        walletConnected: true,
        sessionReady,
        hasAllowance,
        isSpawned
      }
    }
  }

  async function determineInitialState(): Promise<SPAWN_STATE> {
    const context = await buildInitialFlowContext()

    console.log("[Spawn] Flow context:", context)

    // Special case: if we're on a trip page without spawn param, skip the flow
    if (page.route.id === "/(main)/(game)/[tripId]" && !page.url.searchParams.has("spawn")) {
      console.log("[Spawn] On trip page without spawn param → EXIT_FLOW")
      return SPAWN_STATE.EXIT_FLOW
    }

    const nextState = determineNextState(context)
    console.log("[Spawn] Initial state:", nextState)

    return nextState
  }

  onMount(async () => {
    console.log("[Spawn] Component mounted")

    // Register the exit flow callback
    spawnState.state.setOnExitFlow(spawned)

    // Reset state machine to INIT
    spawnState.state.reset()

    // Determine initial state and transition
    // For DRAWBRIDGE: drawbridge is guaranteed to be initialized by Loading component
    // For BURNER: no async initialization needed
    const initialState = await determineInitialState()
    console.log("[Spawn] Initial state determined:", initialState)
    spawnState.state.transitionTo(initialState)

    // Start background music after a delay
    // (when already spawned we pass through quickly and music might start unnecessarily)
    await new Promise(resolve => setTimeout(resolve, 500))
    if ($UIState === UI.SPAWNING) {
      backgroundMusic.play({ category: "ratfunMusic", id: "spawn", loop: true })
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
    {#if spawnState.state.current === SPAWN_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if spawnState.state.current === SPAWN_STATE.INTRODUCTION}
      <Introduction />
    {:else if spawnState.state.current === SPAWN_STATE.ALLOWANCE}
      <Allowance />
    {:else if spawnState.state.current === SPAWN_STATE.ALLOWANCE__LOADING}
      <AllowanceLoading />
    {:else if spawnState.state.current === SPAWN_STATE.SESSION}
      <Session />
    {:else if spawnState.state.current === SPAWN_STATE.SESSION__LOADING}
      <SessionLoading />
    {:else if spawnState.state.current === SPAWN_STATE.SESSION_AND_SPAWN}
      <SessionAndSpawn />
    {:else if spawnState.state.current === SPAWN_STATE.SESSION_AND_SPAWN__LOADING}
      <SessionAndSpawnLoading />
    {:else if spawnState.state.current === SPAWN_STATE.SPAWN}
      <SpawnComponent />
    {:else if spawnState.state.current === SPAWN_STATE.SPAWN__LOADING}
      <SpawnLoading />
    {:else if spawnState.state.current === SPAWN_STATE.DONE}
      <Done />
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
