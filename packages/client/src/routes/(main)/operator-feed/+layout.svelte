<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { CenterBar, SlideToggle } from "$lib/components/Shared"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { FEATURES } from "$lib/config/features"
  import { Feed } from "$lib/components/OperatorFeed/Feed"
  import { Stats } from "$lib/components/OperatorFeed/Stats"
  import { phoneActiveFeedView } from "$lib/components/OperatorFeed/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  onMount(() => {
    backgroundMusic.play({ category: "ratfunMusic", id: "main", loop: true })
  })

  onDestroy(() => {
    backgroundMusic.stop()
  })

  const slideOptions = [
    { value: "feed", label: "FEED" },
    { value: "stats", label: "LEADERBOARD" }
  ]

  function handleSlideChange(value: string) {
    phoneActiveFeedView.set(value as "feed" | "stats")
  }
</script>

{#if $isPhone}
  <!-- Phone Layout: single column with toggle on top -->
  <div class="phone-feed-container">
    {#if FEATURES.ENABLE_LEADERBOARD}
      <div class="phone-toggle-container">
        <SlideToggle
          options={slideOptions}
          value={$phoneActiveFeedView}
          onchange={handleSlideChange}
        />
      </div>
    {/if}
    <div class="phone-feed-content">
      {#if $phoneActiveFeedView === "feed" || !FEATURES.ENABLE_LEADERBOARD}
        <Feed />
      {:else}
        <Stats />
      {/if}
    </div>
  </div>
{:else}
  <!-- Desktop Layout -->
  {#if FEATURES.ENABLE_LEADERBOARD}
    <div class="feed-container">
      <Feed />
    </div>
    <CenterBar />
    <div class="stats-container">
      <Stats />
    </div>
  {:else}
    <div class="feed-container full-width">
      <Feed />
    </div>
  {/if}
{/if}

<style lang="scss">
  .phone-feed-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .phone-feed-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    > :global(*) {
      flex: 1;
      min-height: 0;
    }
  }

  .phone-toggle-container {
    height: var(--phone-slide-toggle-height);
    flex-shrink: 0;
    background: var(--background);
  }

  .feed-container {
    height: 100%;
    flex: 2;
    min-width: 0;
    display: flex;
    flex-direction: column;

    &.full-width {
      width: 100%;
      flex: 1;
    }
  }

  .stats-container {
    position: relative;
    overflow: visible;
    height: 100%;
    background-image: url("/images/texture-5.png");
    background-size: 200px;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
</style>
