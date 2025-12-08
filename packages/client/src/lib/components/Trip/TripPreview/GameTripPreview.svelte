<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { goto } from "$app/navigation"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { ratTotalValue, playerHasLiveRat } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import {
    TripPreviewHeader,
    TripPreviewPrompt,
    EnterTripButton,
    NoRatWarning
  } from "$lib/components/Trip"

  import { BackButton, NoImage } from "$lib/components/Shared"

  let {
    tripId,
    trip,
    sanityTripContent
  }: { tripId: Hex; trip?: Trip; sanityTripContent?: SanityTrip } = $props()

  // Check if we have chain data
  let hasChainData = $derived(!!trip)

  // Only calculate these when we have chain data
  let minRatValueToEnter = $derived(
    trip ? getTripMinRatValueToEnter(trip.tripCreationCost) : undefined
  )

  let tripOutcomes = $state<Outcome[]>()

  //  Show enter button if:
  //  * - We have chain data
  //  * - Trip is not depleted
  //  * - Rat exists and is alive
  let showEnterButton = $derived(
    hasChainData &&
      (trip?.balance ?? 0) > 0 &&
      $playerHasLiveRat &&
      ratState.state.current !== RAT_BOX_STATE.DEPLOYING_RAT
  )

  // Show no rat warning if:
  //  * - Rat does not exist or is dead
  //  * - OR we don't have chain data (can't enter anyway)
  let showNoRatWarning = $derived(
    !hasChainData || !$playerHasLiveRat || ratState.state.current === RAT_BOX_STATE.DEPLOYING_RAT
  )

  const onBackButtonClick = () => {
    goto("/")
  }

  // Image URL from CMS for fallback
  let tripImageUrl = $derived.by(() => {
    const image = sanityTripContent?.image
    if (image) {
      const result = urlFor(image)
      if (result === "") return ""
      return result.width(600).auto("format").url()
    }
    return ""
  })

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }

  // Get prompt from either source
  let prompt = $derived(trip?.prompt || sanityTripContent?.prompt || "")

  onMount(() => {
    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    // Sort the outcomes in order of creation
    tripOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<div class="game-trip-preview">
  <!-- Back Button -->
  <div class="back-button-container">
    <BackButton onclick={onBackButtonClick} />
  </div>

  <!-- Header -->
  <div class="trip-header">
    {#if hasChainData && trip}
      <!-- Use existing TripPreviewHeader when we have chain data -->
      <TripPreviewHeader {trip} {tripId} />
    {:else}
      <!-- Fallback header using sanity data -->
      <div class="trip-preview-header-fallback">
        {#if !$isPhone}
          <div class="column left">
            <div class="trip-image">
              {#if tripImageUrl}
                <img src={tripImageUrl} alt={`trip #${sanityTripContent?.index}`} />
              {:else}
                <NoImage />
              {/if}
            </div>
          </div>
        {/if}
        <div class="info">
          <div class="row index">
            <div class="label">{UI_STRINGS.trip.toUpperCase()}</div>
            <div class="value">#{sanityTripContent?.index ?? "?"}</div>
          </div>
          <div class="row">
            <div class="label">{UI_STRINGS.creator.toUpperCase()}</div>
            <div class="value">{sanityTripContent?.ownerName || "Unknown"}</div>
          </div>
          <div class="row">
            <div class="label">
              {UI_STRINGS.visits.toUpperCase()} / {UI_STRINGS.kills.toUpperCase()}
            </div>
            <div class="value">
              {sanityTripContent?.visits ?? 0} / {sanityTripContent?.kills ?? 0}
            </div>
          </div>
          <div class="row depleted">
            <div class="label">{UI_STRINGS.balance.toUpperCase()}</div>
            <div class="value">DEPLETED</div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Prompt -->
  <div class="trip-prompt">
    {#if hasChainData && trip}
      <TripPreviewPrompt {trip} />
    {:else}
      <!-- Fallback prompt using sanity data -->
      <div class="trip-preview-prompt-fallback">
        <div class="content {getPromptLengthClass(prompt)}">
          {renderSafeString(prompt)}
        </div>
      </div>
    {/if}
  </div>

  <!-- Bottom section -->
  <div class="trip-bottom">
    {#if showNoRatWarning}
      <NoRatWarning />
    {/if}

    {#if showEnterButton && trip && minRatValueToEnter !== undefined}
      {@const minValue = $minRatValueToEnter ?? 0}
      <EnterTripButton
        {trip}
        disabled={busy.LiquidateRat.current != 0 || ($ratTotalValue || 0) < minValue}
        {tripId}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  .game-trip-preview {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    max-height: 100%;
    overflow: hidden;

    .trip-header {
      width: 100%;
      border-bottom: var(--default-border-style);
      flex-shrink: 0;
      overflow: hidden;
      height: 300px;

      @media (max-width: 800px) {
        height: auto;
      }
    }

    .trip-prompt {
      flex: 1; /* Take remaining space */
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      line-height: 1.5em;
      background: var(--background);
    }

    .trip-bottom {
      height: 140px;
      width: 100%;
      border-top: var(--default-border-style);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 800px) {
        height: 200px;
      }
    }
  }

  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: 10;
  }

  // Fallback header styles (when chain data not available)
  .trip-preview-header-fallback {
    border-bottom: var(--default-border-style);
    display: flex;
    flex-direction: row;
    background: var(--background);
    height: 300px;

    @media (max-width: 800px) {
      flex-direction: column;
      height: auto;
    }

    .column.left {
      height: 100%;
      width: 280px;
      margin: 0 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      @media (max-width: 800px) {
        width: 100%;
        height: auto;
        margin: 0;
      }

      .trip-image {
        line-height: 0;
        width: 280px;
        mix-blend-mode: screen;
        border-radius: 20px;
        border: 5px solid var(--foreground-light-transparent);
        overflow: hidden;

        @media (max-width: 800px) {
          width: 100%;
          border-radius: 0;
          border: none;
        }

        img {
          display: block;
          width: 100%;
          height: 100%;
          aspect-ratio: 1/1;
          object-fit: cover;

          @media (max-width: 800px) {
            aspect-ratio: 2/0.75;
          }
        }
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      flex: 1;

      @media (max-width: 800px) {
        width: 100%;
      }

      .row {
        width: 100%;
        border-bottom: var(--default-border-style);
        height: 40px;
        padding-left: 5px;
        padding-right: 10px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-small);

        &:last-child {
          border-bottom: none;
        }

        @media (max-width: 800px) {
          height: 30px;
        }

        .value {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-normal);
        }

        &.index {
          color: var(--color-grey-mid);
        }

        &.depleted .value {
          color: var(--color-bad);
        }
      }
    }
  }

  // Fallback prompt styles (when chain data not available)
  .trip-preview-prompt-fallback {
    word-break: break-word;
    overflow-wrap: anywhere;
    width: 100%;
    font-family: var(--special-font-stack);
    background: var(--background-dark-transparent);
    height: 100%;

    .content {
      max-width: 55ch;
      padding-top: 20px;
      padding-bottom: 10px;
      padding-inline: 10px;
      line-height: 0.9em;

      &.short {
        font-size: var(--font-size-extra-large);
      }

      &.medium {
        font-size: var(--font-size-extra-large);
      }

      &.long {
        font-size: var(--font-size-large);
      }

      &.extra-long {
        font-size: var(--font-size-normal);
      }
    }
  }
</style>
