<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { getDrawbridge, isSessionReady } from "$lib/modules/drawbridge"
  import { spawnState, SPAWN_STATE, determineNextState } from "$lib/components/Spawn/state.svelte"
  import { buildFlowContextSync, checkHasAllowance } from "$lib/components/Spawn/flowContext"
  import { SmallSpinner } from "$lib/components/Shared"
  import { errorHandler } from "$lib/modules/error-handling"
  import { isUserRejectionError } from "$lib/modules/error-handling/utils"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "@ratfun/common/mud"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { WALLET_TYPE } from "@ratfun/common/basic-network"
  import { initEntities, isEntitiesInitialized } from "$lib/modules/chain-sync"
  import { addressToId } from "$lib/modules/utils"

  let error = $state<string | null>(null)
  let isUserRejection = $state(false)
  let loadingText = $state<string>("Setting up session")

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

      // Check if user rejected the transaction
      if (isUserRejectionError(err)) {
        isUserRejection = true
        error = UI_STRINGS.userRejectedSession
        // Log to Sentry but don't show toast (already suppressed by SILENT_TOAST_ERRORS)
        errorHandler(err, "Session setup rejected by user")
      } else {
        error = err instanceof Error ? err.message : "Session setup failed"
        // Send to Sentry and show user-friendly toast
        errorHandler(err, "Session setup failed")
      }

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

<div class="outer-container">
  <div class="inner-container">
    {#if error}
      <div
        class="message"
        class:error={!isUserRejection}
        class:info={isUserRejection}
        in:fade={{ duration: 200 }}
      >
        {error}
      </div>
    {:else}
      <div class="message" in:fade={{ duration: 200 }}>
        {loadingText}
        <SmallSpinner soundOn />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
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
          background: var(--color-bad);
          color: var(--background);
        }

        &.info {
          background: var(--foreground);
          color: var(--background);
        }
      }
    }
  }
</style>
