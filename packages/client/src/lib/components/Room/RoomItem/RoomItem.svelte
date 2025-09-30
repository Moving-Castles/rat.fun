<script lang="ts">
  import type { Hex } from "viem"
  import { fade } from "svelte/transition"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { getRoomMaxValuePerWin } from "$lib/modules/state/utils"
  import { staticContent } from "$lib/modules/content"
  import { NoImage } from "$lib/components/Shared"

  import type { Room as SanityRoom } from "@sanity-types"

  let { roomId, room, index }: { roomId: Hex; room: Room; index: number } = $props()

  console.log("index", index)

  // Portion of room creation cost
  let maxValuePerWin = getRoomMaxValuePerWin(room.roomCreationCost, room.balance)

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
  </div>
  <!-- COLUMN RIGHT -->
  <div class="column right">
    <!-- PROMPT -->
    <div class="room-prompt {getPromptLengthClass(room.prompt)}">
      <div class="content">
        {renderSafeString(room.prompt)}
      </div>
    </div>
    <!-- MAX WIN -->
    <div class="room-info-max-win">
      <span class="max-win">Max Win: ${$maxValuePerWin}</span>
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

        .room-prompt {
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

        .room-info-max-win {
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
