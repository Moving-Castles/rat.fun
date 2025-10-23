<script lang="ts">
  import type { Hex } from "viem"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { getTripMaxValuePerWin } from "$lib/modules/state/utils"
  import { staticContent } from "$lib/modules/content"
  import { playSound } from "$lib/modules/sound"

  import { Tooltip, NoImage } from "$lib/components/Shared"

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
      const result = urlFor(image)
      if (result == "") {
        return false
      } else {
        return result.width(400).auto("format").url()
      }
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
    <div class="meta-data">
      <div class="meta-data-item max-win">
        <div class="inner">
          <Tooltip content="Max Win">
            {CURRENCY_SYMBOL}{$maxValuePerWin}
          </Tooltip>
        </div>
      </div>
      <div class="meta-data-item trip-factor">
        <div class="inner">
          <Tooltip content="Trip Factor">
            {sanityTripContent?.tripFactor?.toFixed(2) ?? "??"}
          </Tooltip>
        </div>
      </div>
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
    // overflow: hidden;
    background: var(--background-semi-transparent);

    &.disabled {
      opacity: 0.5;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.8);

      .trip-image {
        transform: scale(1.05);
      }
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
          mix-blend-mode: screen;
          border-radius: 20px;
          border: 5px solid rgba(255, 255, 255, 0.2);
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

      &.right {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        flex-wrap: nowrap;

        .trip-prompt {
          width: calc(100% - 100px);
          padding-top: 5px;
          padding: 5px;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-family: var(--special-font-stack);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: normal;
          line-height: 0.9em;

          &.short {
            font-size: var(--font-size-large);
          }

          &.medium {
            font-size: var(--font-size-large);
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

        .meta-data {
          border-left: var(--default-border-style);
          padding-left: 10px;
          width: 100px;

          .meta-data-item {
            background: rgba(255, 255, 255, 0.4);
            color: var(--background);
            margin-bottom: 5px;
            border-radius: 4px;

            .inner {
              padding: 10px;
            }
          }
        }

        .small {
          font-size: var(--font-size-small);
        }
      }
    }
  }
</style>
