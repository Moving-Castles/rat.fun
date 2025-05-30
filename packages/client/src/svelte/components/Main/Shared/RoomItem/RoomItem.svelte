<script lang="ts">
  import type { Hex } from "viem"
  import { getUIState } from "@modules/ui/state.svelte"
  import { urlFor } from "@modules/content/sanity"
  import { getRoomOwnerName } from "@modules/state/base/utils"
  import { blocksToReadableTime, renderSafeString } from "@modules/utils"
  import { blockNumber } from "@modules/network"
  import { staticContent } from "@modules/content"
  import NumberGoing from "@components/Main/Shared/NumberGoing/NumberGoing.svelte"

  import type { Room as SanityRoom } from "@sanity-types"

  import NoImage from "@components/Main/Shared/NoImage/NoImage.svelte"

  let { roomId, room }: { roomId: Hex; room: Room } = $props()

  let sanityRoomContent: SanityRoom | undefined = $derived(
    $staticContent?.rooms?.find(r => r._id.trim() == roomId.trim()) ?? undefined
  )

  let { rooms } = getUIState()

  let roomOutcomes = $derived(
    $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []
  )

  $effect(() => {
    $inspect(roomOutcomes)
  })

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }
</script>

<button
  class="room-listing-item"
  class:disabled={room.balance == 0}
  onclick={() => rooms.preview(roomId, false)}
>
  <!-- COLUMN LEFT -->
  <div class="column left">
    <div class="room-image">
      {#if sanityRoomContent?.image}
        <img
          src={urlFor(sanityRoomContent?.image)
            .width(400)
            .auto("format")
            // .saturation(-100)
            .url()}
          alt={`room #${room.index}`}
        />
      {:else}
        <NoImage />
      {/if}
    </div>
    <div class="room-balance">
      <!-- BALANCE -->
      <span class="balance" class:depleted={room.balance == 0}>
        Balance: $<NumberGoing muted={true} value={room.balance} />
        <!-- Balance: ${room.balance} -->
      </span>
    </div>
  </div>
  <!-- COLUMN RIGHT -->
  <div class="column right">
    <!-- SECTION 1 -->
    <div class="section">
      <!-- TOP ROW -->
      <div class="room-info-row top">
        <!-- INDEX -->
        <span class="index small">Room #{room.index}</span>
        <!-- DIVIDER -->
        <span class="divider">•</span>
        <!-- CREATION TIME  -->
        <span class="creation-time small">
          {blocksToReadableTime(
            Number($blockNumber) - Number(room.creationBlock)
          )}
        </span>
      </div>
      <!-- PROMPT -->
      <div class="room-prompt {getPromptLengthClass(room.prompt)}">
        <div class="content">
          {renderSafeString(room.prompt)}
        </div>
      </div>
    </div>

    <!-- SECTION 2 -->
    <div class="section">
      <!-- BOTTOM ROW -->
      <div class="room-info-row bottom">
        <!-- OWNER -->
        <span class="owner">{getRoomOwnerName(room)}</span>
        <!-- DIVIDER -->
        <span class="divider">•</span>
        <!-- VISITOR COUNT -->
        <span class="visit-count small">{room.visitCount} visits</span>
        {#if room?.killCount > 0}
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- KILL RATE -->
          <span class="kill-count small">
            {room.killCount} kill{#if room.killCount > 1}s{/if}
          </span>
        {/if}
      </div>
    </div>
  </div>
</button>

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

    &.disabled {
      opacity: 0.5;
    }

    &:hover {
      background-color: var(--color-grey-darker);
    }

    .column {
      &.left {
        height: 100%;
        width: 280px;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        z-index: 0;

        .room-image {
          border: 15px solid transparent;
          border-image: url("/images/border-2.png") 20 repeat;
          line-height: 0;
          width: 100%;
          aspect-ratio: 1/1;

          img {
            display: block;
            width: 100%;
            height: 100%;
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
          background: var(--color-alert);
          padding: 5px;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-family: var(--special-font-stack);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: normal;
          max-height: 160px;

          &.short {
            font-size: 26px;
          }

          &.medium {
            font-size: 24px;
          }

          &.long {
            font-size: 20px;
          }

          &.extra-long {
            font-size: 16px;
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
