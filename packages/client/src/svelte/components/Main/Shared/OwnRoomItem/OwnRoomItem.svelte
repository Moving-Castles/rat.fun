<script lang="ts">
  import type { Hex } from "viem"
  import { getUIState } from "@modules/ui/state.svelte"
  import { blocksToReadableTime, renderSafeString } from "@modules/utils"
  import { blockNumber } from "@modules/network"
  import { gameConfig } from "@modules/state/base/stores"

  let { roomId, room }: { roomId: Hex; room: Room } = $props()

  let { rooms } = getUIState()

  let profit = $derived(
    Number(room.balance) -
      Number($gameConfig?.gameConfig?.roomCreationCost ?? 0)
  )
</script>

<button
  class="room-listing-item"
  class:depleted={room.balance == 0}
  onclick={() => rooms.preview(roomId, true)}
>
  <div class="profit">
    <div
      class="profit-indicator"
      class:positive={profit > 0}
      class:negative={profit < 0}
    >
      <span>
        {#if room.balance == 0}
          Depleted
        {:else}
          Profit: ${profit}
        {/if}
      </span>
    </div>
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
          {renderSafeString(room.roomPrompt)}
        </div>
      </div>
    </div>

    <!-- SECTION 2 -->
    <div class="section">
      <!-- BOTTOM ROW -->
      <div class="room-info-row bottom">
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

    &:hover {
      background-color: var(--color-grey-darker);
    }

    &.depleted {
      opacity: 0.5;
    }

    .profit {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50%;
      height: 100%;

      .profit-indicator {
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 70%;
        aspect-ratio: 1/1;
        border: var(--default-border-style);

        &.positive {
          background-color: var(--color-health);
        }

        &.negative {
          background-color: var(--color-death);
        }
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
    }
  }
</style>
