<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { sendSpawn } from "$lib/modules/action-manager/index.svelte"
  import { player } from "$lib/modules/state/stores"
  import { waitForPropertyChangeFrom } from "$lib/modules/state/utils"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { SmallSpinner } from "$lib/components/Shared"

  let error = $state<string | null>(null)
  let spawning = $state(true)
  let loadingText = $state<string>("Connecting Operator")

  async function executeSpawn() {
    const name = spawnState.data.playerName
    console.log("[Spawning] Starting spawn with name:", name)

    // Defensive check - should never happen due to state machine guarantees
    if (!name) {
      console.error("[Spawning] No name found in state - this should not happen")
      spawnState.state.transitionTo(SPAWN_STATE.SPAWN)
      return
    }

    try {
      // Execute spawn transaction
      console.log("[Spawning] Executing spawn transaction")
      await sendSpawn(name)
      console.log("[Spawning] Spawn transaction sent, waiting for player name to update")

      // Wait for player name to be set
      await waitForPropertyChangeFrom(player, "name", undefined, 10000)

      console.log("[Spawning] Player name updated successfully")
      // Success! Transition to DONE
      spawning = false
      spawnState.state.transitionTo(SPAWN_STATE.DONE)
    } catch (err) {
      console.error("[Spawning] Spawn failed:", err)
      error = err instanceof Error ? err.message : "Spawn failed"
      spawning = false

      // Wait a moment to show error, then go back to form
      setTimeout(() => {
        spawnState.state.transitionTo(SPAWN_STATE.SPAWN)
      }, 2000)
    }
  }

  onMount(() => {
    console.log("[Spawning] Component mounted")
    executeSpawn()
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if error}
      <div class="message error" in:fade={{ duration: 200 }}>
        {error}
      </div>
    {:else if spawning}
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
      width: var(--spawn-inner-width);
      max-width: 90dvw;

      .message {
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        background: var(--background);
        color: var(--foreground);
        padding: 20px;
        text-align: center;
        margin-top: 20px;

        &.error {
          background: orangered;
          color: var(--background);
        }
      }
    }
  }
</style>
