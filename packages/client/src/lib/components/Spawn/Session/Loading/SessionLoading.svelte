<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { getDrawbridge, isSessionReady } from "$lib/modules/drawbridge"
  import { spawnState, SPAWN_STATE, determineNextState } from "$lib/components/Spawn/state.svelte"
  import { buildFlowContextSync, checkHasAllowance } from "$lib/components/Spawn/flowContext"
  import { SmallSpinner } from "$lib/components/Shared"
  import { errorHandler } from "$lib/modules/error-handling"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { initEntities, isEntitiesInitialized } from "$lib/modules/chain-sync"
  import { addressToId } from "$lib/modules/utils"

  let error = $state<string | null>(null)

  async function executeSessionSetup() {
    console.log("[SessionLoading] Starting session setup")

    try {
      const drawbridge = getDrawbridge()
      await drawbridge.setupSession()

      console.log("[SessionLoading] Session setup transaction complete, waiting for ready state")

      // Wait for session to be ready before transitioning
      const checkInterval = setInterval(async () => {
        if ($isSessionReady) {
          console.log("[SessionLoading] Session is ready")
          clearInterval(checkInterval)

          // Initialize wallet network now that session is ready
          const drawbridge = getDrawbridge()
          const state = drawbridge.getState()
          if (state.sessionClient && state.userAddress) {
            console.log("[SessionLoading] Initializing wallet network")
            const wallet = setupWalletNetwork($publicNetwork, state.sessionClient)
            initWalletNetwork(wallet, state.userAddress, WALLET_TYPE.DRAWBRIDGE)

            // Initialize entities if not already done (Scenario B)
            if (!isEntitiesInitialized()) {
              const playerId = addressToId(state.userAddress)
              console.log("[SessionLoading] Initializing entities for player:", playerId)
              await initEntities({ activePlayerId: playerId })
            }
          }

          // After session setup, determine next state based on current context
          const hasAllowance = state.userAddress
            ? await checkHasAllowance(state.userAddress)
            : false
          const context = buildFlowContextSync(hasAllowance)
          const nextState = determineNextState(context)

          console.log("[SessionLoading] Flow context:", context)
          console.log("[SessionLoading] Next state:", nextState)

          spawnState.state.transitionTo(nextState)
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!$isSessionReady) {
          console.error("[SessionLoading] Session setup timed out")
          error = "Session setup timed out"
          setTimeout(() => {
            spawnState.state.transitionTo(SPAWN_STATE.SESSION)
          }, 2000)
        }
      }, 10000)
    } catch (err) {
      console.error("[SessionLoading] Session setup failed:", err)
      error = err instanceof Error ? err.message : "Session setup failed"

      // Send to Sentry and show user-friendly toast
      errorHandler(err, "Session setup failed")

      // Wait a moment to show error, then go back to setup screen
      setTimeout(() => {
        spawnState.state.transitionTo(SPAWN_STATE.SESSION)
      }, 2000)
    }
  }

  onMount(() => {
    console.log("[SessionLoading] Component mounted")
    executeSessionSetup()
  })
</script>

<div class="debug-badge">SESSION_LOADING</div>
<div class="outer-container">
  <div class="inner-container">
    {#if error}
      <div class="message error" in:fade={{ duration: 200 }}>
        {error}
      </div>
    {:else}
      <div class="message" in:fade={{ duration: 200 }}>
        Setting up session
        <SmallSpinner soundOn />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .debug-badge {
    position: fixed;
    top: 50px;
    right: 10px;
    background: magenta;
    color: white;
    padding: 4px 8px;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    border-radius: 4px;
    display: none;
  }

  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;
      max-width: 90dvw;

      .message {
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        background: var(--background);
        color: var(--foreground);
        padding: 20px;
        text-align: center;

        &.error {
          background: orangered;
          color: var(--background);
        }
      }
    }
  }
</style>
