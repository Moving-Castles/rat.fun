<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import type { Hex } from "viem"
  import { getRoomOwnerName } from "@modules/state/base/helpers"
  import { truncateString, blocksToReadableTime } from "@modules/utils"
  import { blockNumber } from "@modules/network"

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let { rooms } = getUIState()
</script>

<button
  class="room-listing-item"
  class:disabled={room.balance <= 0 && !isOwnRoomListing}
  onclick={() => rooms.preview(roomId, isOwnRoomListing)}
>
  <!-- IMAGE -->
  <div class="room-image">
    <img src="/images/room3.jpg" alt={room.name} />
  </div>
  <!-- INFO -->
  <div class="room-info">
    <!-- SECTION 1 -->
    <div class="section">
      <!-- TOP ROW -->
      <div class="room-info-row top">
        <!-- NAME -->
        <span class="name">{room.name}</span>
        <!-- DIVIDER -->
        <span class="divider">•</span>
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
      <div class="room-prompt">{truncateString(room.roomPrompt, 100)}</div>
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
        <span class="balance">${room.balance}</span>
        <!-- DIVIDER -->
        <span class="divider">•</span>
        <!-- VISITOR COUNT -->
        <span class="visit-count small">{room.visitCount} visits</span>
        <!-- DIVIDER -->
        <span class="divider">•</span>
        <!-- KILL RATE -->
        <span class="kill-count small">{room.killCount ?? 0} kills</span>
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
    border-bottom: 1px solid white;
    padding: var(--room-item-padding);
    cursor: pointer;
    height: var(--room-item-height);
    width: 100%;
    color: white;
    text-align: left;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
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
        padding-top: 5px;
        margin-top: 5px;
        margin-bottom: 5px;
        font-size: var(--font-size-small);
      }

      .index {
        color: var(--color-grey-mid);
      }

      .creation-time {
        color: var(--color-grey-mid);
      }

      .name {
        background: var(--color-alert);
        color: black;
        padding: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 25ch;
      }

      .balance {
        background: var(--color-value);
        color: black;
        padding: 5px;
      }

      .small {
        font-size: var(--font-size-small);
      }

      .divider {
        color: var(--color-grey-light);
      }

      .owner {
        background: var(--color-grey-light);
        color: black;
        padding: 5px;
      }
    }
  }
</style>
