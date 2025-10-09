<script lang="ts">
  import type { Hex } from "viem"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { getTripMaxValuePerWin } from "$lib/modules/state/utils"
  import { staticContent } from "$lib/modules/content"
  import { NoImage } from "$lib/components/Shared"
  import { playSound } from "$lib/modules/sound"

  import type { Trip as SanityTrip } from "@sanity-types"

  let { tripId, trip }: { tripId: Hex; trip: Trip } = $props()

  // Portion of trip creation cost
  let maxValuePerWin = getTripMaxValuePerWin(trip.tripCreationCost, trip.balance)

  let sanityTripContent: SanityTrip | undefined = $derived(
    $staticContent?.trips?.find(r => r._id.trim() == tripId.trim()) ?? undefined
  )

  let tripImageUrl = $derived.by(() => {
    const image = sanityTripContent?.image
    if (image) {
      // Only call urlFor if image is defined
      return urlFor(image)?.width(400)?.auto("format")?.url()
    } else {
      return false
    }
  })

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }

  const onmousedown = () => {
    playSound("ratfunUI", "smallButtonDown")
  }

  const onmouseup = () => {
    playSound("ratfunUI", "smallButtonUp")
  }

  const onmouseenter = () => {
    playSound("ratfunUI", "hover2")
  }
</script>

<a
  href="/{tripId}"
  class="trip-listing-item"
  class:disabled={Number(trip.balance) == 0}
  {onmouseup}
  {onmousedown}
  {onmouseenter}
>
  <!-- COLUMN LEFT -->
  <div class="column left">
    <div class="trip-image">
      {#if tripImageUrl}
        <img src={tripImageUrl} alt={`trip #${trip.index}`} />
      {:else}
        <NoImage />
      {/if}
    </div>
  </div>
  <!-- COLUMN RIGHT -->
  <div class="column right">
    <!-- PROMPT -->
    <div class="trip-prompt {getPromptLengthClass(trip.prompt)}">
      <div class="content">
        {renderSafeString(trip.prompt)}
      </div>
    </div>
    <!-- MAX WIN -->
    <div class="trip-info-max-win">
      <span class="max-win">Max Win: {CURRENCY_SYMBOL}{$maxValuePerWin}</span>
    </div>
  </div>
</a>

<style lang="scss">
  .trip-listing-item {
    display: flex;
    background: transparent;
    outline: none;
    border: none;
    border-bottom: var(--default-border-style);
    padding: var(--trip-item-padding);
    cursor: pointer;
    width: 100%;
    color: var(--foreground);
    text-align: left;
    overflow: hidden;
    background: var(--background-semi-transparent);

    &.disabled {
      opacity: 0.5;
    }

    &:hover {
      background-color: var(--background);
    }

    .column {
      &.left {
        height: 100%;
        width: 280px;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        z-index: var(--z-base);

        .trip-image {
          line-height: 0;
          width: 100%;
          filter: grayscale(100%);

          img {
            display: block;
            width: 100%;
            height: 100%;
            aspect-ratio: 1/1;
            object-fit: cover;
            mix-blend-mode: screen;
          }
        }
      }

      &.right {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        flex-wrap: nowrap;

        .trip-prompt {
          width: calc(100% - 100px);
          padding-top: 5px;
          margin-top: 5px;
          margin-bottom: 5px;
          padding: 5px;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-family: var(--special-font-stack);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: normal;
          max-height: 160px;

          &.short {
            font-size: var(--font-size-normal);
          }

          &.medium {
            font-size: var(--font-size-normal);
          }

          &.long {
            font-size: var(--font-size-normal);
          }

          &.extra-long {
            font-size: var(--font-size-normal);
          }

          .content {
            max-width: 55ch;
          }
        }

        .trip-info-max-win {
          border-left: var(--default-border-style);
          padding-left: 10px;
          width: 100px;
        }

        .small {
          font-size: var(--font-size-small);
        }
      }
    }
  }
</style>
