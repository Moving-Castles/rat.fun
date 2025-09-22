<script lang="ts">
  import type { Hex } from "viem"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { NoImage } from "$lib/components/Shared"

  import type { Room as SanityRoom } from "@sanity-types"

  let { roomId, room }: { roomId: Hex; room: Room } = $props()

  let sanityRoomContent: SanityRoom | undefined = $derived(
    $staticContent?.rooms?.find(r => r._id.trim() == roomId.trim()) ?? undefined
  )

  let roomImageUrl = $derived.by(() => {
    const image = sanityRoomContent?.image
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
</script>

<a href="/{roomId}" class="room-listing-item" class:disabled={Number(room.balance) == 0}>
  <!-- COLUMN LEFT -->
  <div class="column left">
    <div class="room-image">
      {#if roomImageUrl}
        <img src={roomImageUrl} alt={`trip #${room.index}`} />
      {:else}
        <NoImage />
      {/if}
    </div>
    <!-- <div class="room-balance"></div> -->
  </div>
  <!-- COLUMN RIGHT -->
  <div class="column right">
    <!-- SECTION 1 -->
    <div class="section">
      <!-- TOP ROW -->
      <!-- <div class="room-info-row top"> -->
      <!-- INDEX -->
      <!-- <span class="index small">Trip #{room.index}</span> -->
      <!-- DIVIDER -->
      <!-- <span class="divider">•</span> -->
      <!-- CREATION TIME  -->
      <!-- <span class="creation-time small">
          {blocksToReadableTime(Number($blockNumber) - Number(room.creationBlock))}
        </span> -->
      <!-- </div> -->
      <!-- PROMPT -->
      <div class="room-prompt {getPromptLengthClass(room.prompt)}">
        <div class="content">
          {renderSafeString(room.prompt)}
        </div>
      </div>
    </div>
  </div>
</a>

<style lang="scss">
  .room-listing-item {
    display: flex;
    background: transparent;
    outline: none;
    border: none;
    border-bottom: var(--default-border-style);
    padding: var(--room-item-padding);
    cursor: pointer;
    height: var(--room-item-height);
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

        .room-image {
          line-height: 0;
          width: 100%;

          img {
            display: block;
            width: 100%;
            height: 100%;
            aspect-ratio: 1/1;
            object-fit: cover;
          }
        }

        .room-balance {
          border: var(--default-border-style);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-value);
          color: var(--background);
        }
      }

      &.right {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;

        .room-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;

          &.top {
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--color-grey-mid);
          }

          &.bottom {
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid var(--color-grey-mid);
          }
        }

        .room-prompt {
          width: 100%;
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

        .index {
          color: var(--color-grey-mid);
        }

        .creation-time {
          color: var(--color-grey-mid);
        }

        .name {
          background: var(--color-alert);
          color: var(--background);
          padding: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 25ch;
        }

        .balance {
          background: var(--color-value);
          color: var(--background);
          padding: 5px;

          &.depleted {
            background: var(--color-death);
            color: var(--background);
          }
        }

        .small {
          font-size: var(--font-size-small);
        }

        .divider {
          color: var(--color-grey-light);
        }

        .owner {
          background: var(--color-grey-light);
          color: var(--background);
          padding: 5px;
        }
      }
    }
  }
</style>
