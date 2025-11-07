<script lang="ts">
  import { CenterBar, PhoneGameViewButton } from "$lib/components/Shared"
  import RatBox from "$lib/components/Rat/RatBox.svelte"
  import { phoneActiveGameView, isPhone } from "$lib/modules/ui/state.svelte"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  let { children } = $props()
</script>

{#if !$isPhone || $phoneActiveGameView === "ratbox"}
  <div class="ratbox-container">
    <!-- Grid position 1  -->
    <RatBox />
    {#if $isPhone && ratState.state.current === RAT_BOX_STATE.HAS_RAT}
      <PhoneGameViewButton targetView="triplisting" />
    {/if}
  </div>
{/if}
<!-- Grid position 2 -->
{#if !$isPhone}
  <CenterBar />
{/if}
{#if !$isPhone || $phoneActiveGameView === "triplisting"}
  <!-- Grid position 3 -->
  <div class="right-column">
    <div class="triplisting-container">
      {@render children?.()}
      {#if $isPhone}
        <PhoneGameViewButton targetView="ratbox" />
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .ratbox-container {
    height: 100%;
    width: var(--game-column-width);
    flex: 0 0 var(--game-column-width);

    @media (max-width: 800px) {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      flex: 1 1 auto;
    }
  }

  .right-column {
    position: relative;
    overflow: visible;
    height: 100%;
    background-image: url("/images/texture-5.png");
    background-size: 200px;
    width: var(--game-column-width);
    flex: 0 0 var(--game-column-width);

    @media (max-width: 800px) {
      width: 100%;
      flex: 1 1 auto;
    }
  }

  .triplisting-container {
    height: 100%;
    @media (max-width: 800px) {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
  }
</style>
