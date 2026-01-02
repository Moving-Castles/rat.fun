<script lang="ts">
  import type { Hex } from "viem"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { get } from "svelte/store"

  import { loadData } from "$lib/modules/content/sanity"
  import { queries } from "$lib/modules/content/sanity/groq"
  import { urlFor } from "$lib/modules/content/sanity"
  import { publicNetwork } from "$lib/modules/network"
  import { trips } from "$lib/modules/state/stores"
  import { renderSafeString } from "@ratfun/shared-utils"
  import { blocksToReadableTime } from "@ratfun/shared-utils"
  import { blockNumber } from "$lib/modules/network"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import { BigButton, NoImage } from "$lib/components/Shared"

  // Get tripId from URL params
  const tripId = $derived(page.params.tripId as Hex)

  // Try to get chain data (might be available if entities were synced)
  let chainTrip = $derived($trips[tripId])
  let hasChainData = $derived(!!chainTrip)

  let sanityTrip = $state<SanityTrip | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  // Image URL from CMS
  let tripImageUrl = $derived.by(() => {
    const image = sanityTrip?.image
    if (image) {
      const result = urlFor(image)
      if (result === "") return ""
      return result.width(600).auto("format").url()
    }
    return ""
  })

  const goToGame = () => {
    window.location.href = "/"
  }

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }

  // Derive values from chain data when available, fallback to sanity
  let tripIndex = $derived(chainTrip?.index ?? sanityTrip?.index ?? "?")
  let ownerName = $derived(chainTrip?.name ?? sanityTrip?.ownerName ?? "Unknown")
  let visits = $derived(chainTrip?.visitCount ?? sanityTrip?.visits ?? 0)
  let kills = $derived(chainTrip?.killCount ?? sanityTrip?.kills ?? 0)
  let balance = $derived(chainTrip?.balance)
  let prompt = $derived(chainTrip?.prompt ?? sanityTrip?.prompt ?? "")
  let lastVisitBlock = $derived(chainTrip?.lastVisitBlock)

  onMount(async () => {
    try {
      const worldAddress = get(publicNetwork).worldAddress
      const tripContent = await loadData(queries.singleTrip, {
        id: tripId,
        worldAddress
      })

      if (tripContent) {
        sanityTrip = tripContent as SanityTrip
      } else {
        error = "Trip not found"
      }
    } catch (err) {
      console.error("[TouristTrip] Failed to load trip:", err)
      error = "Failed to load trip"
    } finally {
      loading = false
    }
  })
</script>

<div class="tourist-trip">
  {#if loading}
    <div class="loading-state">
      <p>Loading trip...</p>
    </div>
  {:else if error || (!sanityTrip && !hasChainData)}
    <div class="error-state">
      <p>{error || "Trip not found"}</p>
      <div class="button-container">
        <BigButton text="Go to game" onclick={goToGame} />
      </div>
    </div>
  {:else}
    <div class="trip-preview">
      <!-- Header -->
      <div class="trip-header">
        <div class="trip-preview-header">
          {#if !$isPhone}
            <div class="column left">
              <div class="trip-image">
                {#if tripImageUrl}
                  <enhanced:img src={tripImageUrl} alt={`trip #${tripIndex}`} />
                {:else}
                  <NoImage />
                {/if}
              </div>
            </div>
          {/if}
          <div class="info">
            <div class="row index">
              <div class="label">{UI_STRINGS.trip.toUpperCase()}</div>
              <div class="value">#{tripIndex}</div>
            </div>
            <div class="row">
              <div class="label">{UI_STRINGS.creator.toUpperCase()}</div>
              <div class="value">{ownerName}</div>
            </div>
            {#if hasChainData && lastVisitBlock}
              <div class="row">
                <div class="label">{UI_STRINGS.lastVisit.toUpperCase()}</div>
                <div class="value">
                  {blocksToReadableTime(Number($blockNumber) - Number(lastVisitBlock))}
                </div>
              </div>
            {/if}
            <div class="row">
              <div class="label">
                {UI_STRINGS.visits.toUpperCase()} / {UI_STRINGS.kills.toUpperCase()}
              </div>
              <div class="value">{visits} / {kills}</div>
            </div>
            {#if hasChainData && balance !== undefined}
              <div class="row" class:depleted={Number(balance) === 0}>
                <div class="label">{UI_STRINGS.balance.toUpperCase()}</div>
                <div class="value">
                  {#if Number(balance) === 0}
                    DEPLETED
                  {:else}
                    {balance} {CURRENCY_SYMBOL}
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Prompt -->
      <div class="trip-prompt">
        <div class="trip-preview-prompt">
          <div class="content {getPromptLengthClass(prompt)}">
            {renderSafeString(prompt)}
          </div>
        </div>
      </div>

      <!-- Bottom section with CTA -->
      <div class="trip-bottom">
        <BigButton text="Go to game" onclick={goToGame} />
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .tourist-trip {
    position: fixed;
    inset: 0;
    width: 100dvw;
    height: 100dvh;
    background: var(--background);
    color: var(--foreground);
    z-index: var(--z-base);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;

    p {
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
    }
  }

  .button-container {
    width: 300px;
    height: 80px;
  }

  .trip-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    max-height: 80dvh;
    height: 100%;
    overflow: hidden;
    border: var(--default-border-style);
  }

  .trip-header {
    width: 100%;
    border-bottom: var(--default-border-style);
    flex-shrink: 0;
    overflow: hidden;
    height: 300px;
  }

  .trip-prompt {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .trip-bottom {
    height: 180px;
    width: 100%;
    border-top: var(--default-border-style);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // Header styles (matching TripPreviewHeader)
  .trip-preview-header {
    display: flex;
    flex-direction: row;
    background: var(--background);
    height: 300px;

    .column.left {
      height: 100%;
      width: 280px;
      margin: 0 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .trip-image {
        line-height: 0;
        width: 280px;
        mix-blend-mode: screen;
        border-radius: 20px;
        border: 5px solid var(--foreground-light-transparent);
        overflow: hidden;

        img {
          display: block;
          width: 100%;
          height: 100%;
          aspect-ratio: 1/1;
          object-fit: cover;
        }
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      flex: 1;

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

  // Prompt styles (matching TripPreviewPrompt)
  .trip-preview-prompt {
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
