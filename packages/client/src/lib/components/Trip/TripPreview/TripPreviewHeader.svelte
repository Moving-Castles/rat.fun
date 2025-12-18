<script lang="ts">
  import type { Hex } from "viem"
  import {
    getTripMaxValuePerWin,
    getTripMinRatValueToEnter,
    getTripOwnerName
  } from "$lib/modules/state/utils"
  import { lastUpdated, staticContent } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { NoImage } from "$lib/components/Shared"
  import { lightboxState, isPhone } from "$lib/modules/ui/state.svelte"
  import { blocksToReadableTime } from "$lib/modules/utils"
  import { blockNumber } from "$lib/modules/network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let { trip, tripId }: { trip: Trip; tripId?: Hex } = $props()

  const maxValuePerWin = getTripMaxValuePerWin(
    trip.tripCreationCost,
    trip.balance,
    trip.challengeTrip,
    trip.overrideMaxValuePerWinPercentage
  )
  const minRatValueToEnter = getTripMinRatValueToEnter(
    trip.tripCreationCost,
    trip.challengeTrip,
    trip.fixedMinValueToEnter
  )

  // Get trip content from staticContent store instead of props
  let tripContentFromStore = $derived(
    $staticContent?.trips?.find(r => r._id.trim() == tripId?.trim()) ?? undefined
  )

  let tripImageUrl = $derived.by(() => {
    const image = tripContentFromStore?.image
    if (image) {
      const result = urlFor(image)
      if (result === "") {
        return result
      } else {
        return result.width(600).auto("format").url()
      }
    } else {
      return ""
    }
  })

  let tripLightBoxUrl = $derived.by(() => {
    const image = tripContentFromStore?.image
    if (image) {
      const result = urlFor(image)
      if (result === "") {
        return result
      } else {
        return result.width(1920).auto("format").url()
      }
    } else {
      return ""
    }
  })

  const openLightbox = () => {
    lightboxState.open(tripLightBoxUrl, `trip #${trip.index}`)
  }

  // Data rows configuration with reactivity
  let infoRows = $derived([
    {
      label: UI_STRINGS.trip.toUpperCase(),
      value: `#${trip.index}`,
      className: "index",
      hideOnPhone: true
    },
    {
      label: UI_STRINGS.creator.toUpperCase(),
      value: getTripOwnerName(trip),
      hideOnPhone: false
    },
    ...(trip.lastVisitBlock
      ? [
          {
            label: UI_STRINGS.lastVisit.toUpperCase(),
            value: blocksToReadableTime(Number($blockNumber) - Number(trip.lastVisitBlock)),
            className: "last-visit-block",
            hideOnPhone: true
          }
        ]
      : []),
    {
      label: `${UI_STRINGS.visits.toUpperCase()} / ${UI_STRINGS.kills.toUpperCase()}`,
      value: `${String(trip.visitCount)} / ${String(trip?.killCount ?? 0)}`,
      className: "visit-count"
    },
    {
      label: UI_STRINGS.balance.toUpperCase(),
      value: `${trip.balance} ${CURRENCY_SYMBOL}`,
      className: "balance",
      depleted: Number(trip.balance) === 0
    },
    {
      label: UI_STRINGS.minRatValueToEnter.toUpperCase(),
      value: `${$minRatValueToEnter ?? 0} ${CURRENCY_SYMBOL}`,
      className: "min-rat-value-to-enter",
      hideOnPhone: true
    },
    ...($maxValuePerWin > 0
      ? [
          {
            label: UI_STRINGS.maxValuePerWin.toUpperCase(),
            value: `${$maxValuePerWin} ${CURRENCY_SYMBOL}`,
            className: "max-value-per-win"
          }
        ]
      : [])
  ])
</script>

<div class="trip-preview-header">
  <!-- IMAGE -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="column left">
    {#if !$isPhone}
      <div class="trip-image">
        {#key $lastUpdated}
          {#if tripImageUrl}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <img onclick={openLightbox} src={tripImageUrl} alt={`trip #${trip.index}`} />
          {:else}
            <NoImage />
          {/if}
        {/key}
      </div>
    {/if}
  </div>
  <!-- INFO -->
  <div class="info">
    {#each infoRows as row}
      {#if !$isPhone || !row.hideOnPhone}
        <div class="row {row.className || ''}" class:depleted={row.depleted}>
          <div class="label">{row.label}</div>
          <div class="value">{row.value}</div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style lang="scss">
  .trip-preview-header {
    border-bottom: var(--default-border-style);
    display: flex;
    flex-direction: row;
    background: var(--background);
    height: 300px;

    @media (max-width: 800px) {
      flex-direction: column;
      height: auto;
    }

    .column {
      &.left {
        height: 100%;
        width: 280px;
        margin: 0 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: var(--z-base);

        @media (max-width: 800px) {
          width: 100%;
          height: auto;
          margin: 0;
          order: 0;
        }

        .trip-image {
          line-height: 0;
          width: 280px;
          mix-blend-mode: screen;
          border-radius: 20px;
          border: 5px solid var(--foreground-light-transparent);
          overflow: hidden;
          cursor: pointer;

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
    }

    .info {
      display: flex;
      flex-direction: column;
      flex: 1;

      @media (max-width: 800px) {
        order: 1;
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
      }
    }
  }
</style>
