<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { CenterBar, PhoneGameViewButton } from "$lib/components/Shared"
  import RatBox from "$lib/components/Rat/RatBox.svelte"
  import { phoneActiveGameView, isPhone } from "$lib/modules/ui/state.svelte"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  let { children } = $props()

  onMount(() => {
    // Start background music at layout level so it persists across view switches
    backgroundMusic.play({ category: "ratfunMusic", id: "main", loop: true })
  })

  onDestroy(() => {
    // Stop background music when leaving the game entirely
    backgroundMusic.stop()
  })
</script>

{#if $isPhone}
  <!-- Phone Layout: single container with persistent toggle -->
  <div class="phone-game-container">
    {#if ratState.state.current === RAT_BOX_STATE.HAS_RAT}
      <PhoneGameViewButton />
    {/if}
    <div class="phone-game-content">
      {#if $phoneActiveGameView === "ratbox"}
        <RatBox />
      {:else}
        <div class="triplisting-container">
          {@render children?.()}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Desktop Layout -->
  <div class="ratbox-container">
    <RatBox />
  </div>
  <CenterBar />
  <div class="right-column">
    <div class="triplisting-container">
      {@render children?.()}
    </div>
  </div>
{/if}

<style lang="scss">
  .phone-game-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .phone-game-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    > :global(*) {
      flex: 1;
      min-height: 0;
    }

    .triplisting-container {
      background-image: url("/images/texture-5.png");
      background-size: 200px;
    }
  }

  .ratbox-container {
    height: 100%;
    width: var(--game-column-width);
    flex: 0 0 var(--game-column-width);
  }

  .right-column {
    position: relative;
    overflow: visible;
    height: 100%;
    background-image: url("/images/texture-5.png");
    background-size: 200px;
    width: var(--game-column-width);
    flex: 0 0 var(--game-column-width);
  }

  .triplisting-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
