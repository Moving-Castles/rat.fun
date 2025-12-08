<script lang="ts">
  import type { Hex } from "viem"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { getTripOwnerName } from "$lib/modules/state/utils"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { playSound } from "$lib/modules/sound"
  import { NoImage, ResizableText } from "$lib/components/Shared"
  import PopularAlert from "$lib/components/Trip/TripItem/TripItemStats/PopularAlert.svelte"
  import TripItemStats from "./TripItemStats/TripItemStats.svelte"

  let {
    tripId,
    trip,
    disabled = false,
    overlayText = ""
  }: {
    tripId: Hex
    trip: Trip
    disabled?: boolean
    overlayText?: string
  } = $props()

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

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
  }

  const onmouseenter = () => {
    playSound({ category: "ratfunUI", id: "hover2" })
  }
</script>

<a
  href="/{tripId}"
  class="trip-listing-item"
  class:disabled={Number(trip.balance) == 0 || disabled}
  class:not-clickable={disabled}
  {onmouseup}
  {onmousedown}
  {onmouseenter}
>
  {#if disabled && overlayText}
    <div class="overlay">
      <div class="overlay-text">{overlayText}</div>
    </div>
  {/if}
  <!-- COLUMN LEFT -->
  <div class="column left">
    <div class="trip-image">
      {#if tripImageUrl}
        <img src={tripImageUrl} alt={`trip #${trip.index}`} />
      {:else}
        <NoImage />
      {/if}
      <PopularAlert {trip} />
    </div>
  </div>
  <!-- COLUMN RIGHT -->
  <div class="column right">
    <div class="main-info">
      <!-- CREATOR -->
      <div class="trip-creator">
        @{getTripOwnerName(trip)}
      </div>
      <!-- PROMPT -->
      <div class="trip-prompt">
        <ResizableText>
          {renderSafeString(trip.prompt)}
        </ResizableText>
      </div>
    </div>

    <!-- MAX WIN -->
    <div class="meta-data">
      <TripItemStats {trip} />
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
    position: relative;
    // overflow: hidden;
    background: var(--background-semi-transparent);

    .trip-image {
      position: relative;
    }

    @media (max-width: 800px) {
      flex-direction: column;
      padding: 0;
      margin-bottom: 10px;
    }

    &.disabled {
      opacity: 0.7;
    }

    &.not-clickable {
      pointer-events: none;
      cursor: default;
    }

    &:hover {
      background-color: var(--background-dark-transparent);

      .trip-image {
        transform: scale(1.05);
        @media (max-width: 800px) {
          transform: none;
        }
      }
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: var(--background-dark-transparent);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: var(--z-mid);
      pointer-events: none;

      .overlay-text {
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-large);
        color: var(--foreground);
        text-align: center;
        padding: 20px;
        background: var(--color-grey-dark);
        color: var(--background);
      }
    }

    .column {
      &.left {
        height: 100%;
        width: 300px;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        z-index: var(--z-base);

        @media (max-width: 800px) {
          width: 100%;
          margin-right: 0;
          order: 0;
        }

        .trip-image {
          line-height: 0;
          width: 100%;
          mix-blend-mode: screen;
          border-radius: 20px;
          border: 5px solid var(--foreground-light-transparent);
          overflow: hidden;

          @media (max-width: 800px) {
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
              aspect-ratio: 2.4/1;
            }
          }
        }
      }

      &.right {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        flex-wrap: nowrap;

        @media (max-width: 800px) {
          flex-direction: column;
          width: 100%;
          order: 1;
        }

        .main-info {
          width: calc(100% - 100px);
          padding-inline: 5px;

          @media (max-width: 800px) {
            width: 100%;
          }
          .trip-prompt {
            width: 100%;
            height: 100%;
            max-height: 200px;
            padding-top: 5px;
            padding-bottom: 40px;
            word-break: break-word;
            overflow-wrap: anywhere;
            font-family: var(--special-font-stack);
            text-overflow: ellipsis;
            white-space: normal;
            line-height: 0.9em;

            @media (max-width: 800px) {
              padding: 10px;
              order: 2;
              overflow: visible;
              text-overflow: unset;
            }

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

              @media (max-width: 800px) {
                max-width: 100%;
              }
            }
          }

          .trip-creator {
            font-size: var(--font-size-small);
            color: var(--color-grey-mid);
            margin-bottom: 5px;
            width: 100%;
            padding-bottom: 5px;
            border-bottom: var(--default-border-style);

            @media (max-width: 800px) {
              padding-top: 5px;
            }
          }
        }

        .meta-data {
          border-left: var(--default-border-style);
          padding-left: 10px;
          width: 120px;
          height: 200px;

          @media (max-width: 800px) {
            width: 100%;
            height: auto;
            border-left: none;
            border-top: var(--default-border-style);
            padding-left: 0;
            order: 3;
          }
        }

        .small {
          font-size: var(--font-size-small);
        }
      }
    }
  }
</style>
