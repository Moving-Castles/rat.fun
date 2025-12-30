<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import {
    CenterBar,
    SlideToggle,
    BackButton,
    OutcomeLog,
    SmallButton,
    ResizableText
  } from "$lib/components/Shared"
  import { SmallSpinner } from "@ratfun/shared-ui/Loaders"
  import { isPhone, operatorFeedPreviewOutcome } from "$lib/modules/ui/state.svelte"
  import { FEATURES } from "$lib/config/features"
  import { Feed } from "$lib/components/OperatorFeed/Feed"
  import { Stats } from "$lib/components/OperatorFeed/Stats"
  import { phoneActiveFeedView } from "$lib/components/OperatorFeed/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { fly } from "svelte/transition"
  import { loadData } from "$lib/modules/content/sanity"
  import { queries } from "$lib/modules/content/sanity/groq"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { goto } from "$app/navigation"

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

  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      $operatorFeedPreviewOutcome = ""
    }
  }

  $inspect($operatorFeedPreviewOutcome)

  // Get the selected outcome from staticContent
  let selectedOutcomePromise = $derived(
    loadData(queries.singleOutcome, { id: $operatorFeedPreviewOutcome })
  )
</script>

<svelte:window {onkeydown} />

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

{#if $operatorFeedPreviewOutcome !== ""}
  <div transition:fly={{ x: 400, opacity: 1 }} class="overlay">
    <div class="back-container">
      <BackButton
        onclick={() => {
          $operatorFeedPreviewOutcome = ""
        }}
      />
    </div>
    <div class="content">
      {#key $operatorFeedPreviewOutcome}
        {#await selectedOutcomePromise}
          <div class="outcome-loading">
            <SmallSpinner />
          </div>
        {:then selectedOutcome}
          <div class="outcome-view">
            <div class="inner">
              <div class="trip-prompt">
                <ResizableText options={{ maxFontPixels: 60 }}>
                  {selectedOutcome.tripPrompt}
                </ResizableText>
              </div>
              <OutcomeLog outcome={selectedOutcome} />
            </div>
            <SmallButton
              text={"Open trip #" + selectedOutcome.tripIndex}
              onclick={() => {
                goto(`/${selectedOutcome.tripId}`)
              }}
            />
          </div>
        {:catch error}
          {console.error(error)}
        {/await}
      {/key}
    </div>
  </div>
{/if}

<style lang="scss">
  .overlay {
    width: 33.33%;
    min-width: 400px;
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    background: black;
    z-index: 999;
    border-left: var(--default-border-style);
    display: grid;
    flex-direction: column;
    grid-template-rows: 60px 1fr;

    .back-container {
      height: 60px;
      flex-shrink: 0;
    }

    .content {
      height: 100%;
      overflow-y: scroll;

      .outcome-view {
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 60px;

        .inner {
          height: 100%;
          display: grid;
          grid-template-rows: 200px 1fr;
        }
      }
    }
  }
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

  .outcome-view {
    display: flex;
    flex-flow: column nowrap;
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

  .outcome-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
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

  .trip-prompt {
    border-bottom: var(--default-border-style);
    word-break: break-word;
    overflow-wrap: anywhere;
    width: 100%;
    font-family: var(--special-font-stack);
    height: 200px;
    background: white;
    color: black;
    line-height: 1;
    padding: 8px 20px 20px 8px;
  }
</style>
