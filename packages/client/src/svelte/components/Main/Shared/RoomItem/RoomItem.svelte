<script lang="ts">
  import type { Hex } from "viem"
  import { getUIState } from "@modules/ui/state.svelte"
  import { getRoomOwnerName } from "@modules/state/base/utils"
  import { blocksToReadableTime } from "@modules/utils"
  import { urlFor } from "@modules/content"
  import { blockNumber } from "@modules/network"
  import { getContentState } from "@modules/content/state.svelte"

  let { rooms: roomsState } = getContentState()

  let { roomId, room }: { roomId: Hex; room: Room } = $props()

  let sanityRoomContent = $derived(
    roomsState.current.find(r => r._id.trim() == roomId.trim())
  )

  let { rooms } = getUIState()
</script>

<button
  class="room-listing-item"
  class:disabled={room.balance <= 0}
  onclick={() => rooms.preview(roomId, false)}
>
  <!-- IMAGE -->
  <div class="room-image">
    {#if sanityRoomContent}
      <img
        src={urlFor(sanityRoomContent?.image)
          .width(400)
          .auto("format")
          .saturation(-100)
          .url()}
        alt={room.name}
      />
    {:else}
      <img src="/images/room3.jpg" alt={room.name} />
    {/if}
  </div>
  <!-- INFO -->
  <div class="room-info">
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
      <div class="room-prompt">
        <div class="content">
          {room.roomPrompt}
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
        <!-- BALANCE -->
        <span class="balance" class:depleted={room.balance == 0}>
          Balance: ${room.balance}
        </span>
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
      background-color: #222;
    }

    .room-image {
      height: var(--room-item-image-height);
      aspect-ratio: 4/3;
      margin-right: 20px;
      border: 1px solid var(--color-grey-mid);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .room-info {
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
        word-break: break-word; /* Break long words if needed */
        overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */

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
</style>
