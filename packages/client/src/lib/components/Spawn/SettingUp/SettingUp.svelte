<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { getDrawbridge, isSessionReady } from "$lib/modules/drawbridge"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { SmallSpinner } from "$lib/components/Shared"
  import { errorHandler } from "$lib/modules/error-handling"

  // ??? not read
  let setupComplete = $state(false)
  let error = $state<string | null>(null)

  async function executeSessionSetup() {
    console.log("[SettingUp] Starting session setup")

    try {
      const drawbridge = getDrawbridge()
      await drawbridge.setupSession()

      console.log("[SettingUp] Session setup transaction complete, waiting for ready state")
      setupComplete = true

      // Wait for session to be ready before transitioning
      const checkInterval = setInterval(() => {
        if ($isSessionReady) {
          console.log("[SettingUp] Session is ready")
          clearInterval(checkInterval)
          spawnState.state.transitionTo(SPAWN_STATE.INTRODUCTION)
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!$isSessionReady) {
          console.error("[SettingUp] Session setup timed out")
          error = "Session setup timed out"
          setTimeout(() => {
            spawnState.state.transitionTo(SPAWN_STATE.SESSION)
          }, 2000)
        }
      }, 10000)
    } catch (err) {
      console.error("[SettingUp] Session setup failed:", err)
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
    console.log("[SettingUp] Component mounted")
    executeSessionSetup()
  })
</script>

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
