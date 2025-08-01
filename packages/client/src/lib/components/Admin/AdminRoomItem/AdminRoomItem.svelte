<script lang="ts">
  import type { Hex } from "viem"
  import type { PlotPoint } from "$lib/components/Shared/RoomGraph/types"
  import { blocksToReadableTime, renderSafeString } from "$lib/modules/utils"
  import { blockNumber } from "$lib/modules/network"
  import { levels } from "$lib/modules/state/stores"
  import { staticContent } from "$lib/modules/content"
  import { Xed } from "$lib/components/Shared"
  import { RoomGraph } from "$lib/components/Room"

  let { roomId, room }: { roomId: Hex; room: Room } = $props()

  let profit = $derived(Number(room.balance) - Number($levels[room.level]?.roomCreationCost ?? 0))

  let plotData: PlotPoint[] = $derived.by(() => {
    let sanityRoomContent = $staticContent?.rooms?.find(r => r.title == roomId)

    const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []
    // Sort the outcomes in order of creation
    outcomes.sort((a, b) => {
      return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
    })
    const roomOutcomes = outcomes.reverse()

    // Map the values
    return [
      {
        time: 0,
        roomValue: 250,
        meta: sanityRoomContent
      },
      ...roomOutcomes
    ].map((o, i) => {
      return {
        time: i,
        value: o?.roomValue || 0,
        meta: o
      }
    })
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<a href="/admin/{roomId}" class="room-listing-item" class:depleted={Number(room.balance) == 0}>
  {#if Number(room.balance) == 0}
    <div class="depleted-indicator">
      <Xed />
    </div>
  {/if}
  <div class="room-listing-left">
    <div class="room-stats">
      <RoomGraph height={200} {plotData} isEmpty={plotData.length == 1} />
    </div>
    <div class="room-info-row bottom">
      <!-- PROFIT -->
      <div class="profit-indicator" class:positive={profit > 0} class:negative={profit < 0}>
        <span>
          {#if Number(room.balance) == 0}
            Depleted
          {:else}
            ${profit}
          {/if}
        </span>
      </div>
      <!-- BALANCE -->
      <span class="balance" class:depleted={Number(room.balance) == 0}>
        Balance: ${room.balance}
      </span>
      <!-- DIVIDER -->
      <span class="divider">•</span>
      <!-- VISITOR COUNT -->
      <span class="visit-count small">
        {#if Number(room.visitCount) === 1}
          {room.visitCount} visit
        {:else}
          {room.visitCount} visits
        {/if}
      </span>
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
          {blocksToReadableTime(Number($blockNumber) - Number(room.creationBlock))}
        </span>
      </div>
      <!-- PROMPT -->
      <div class="room-prompt">
        <div class="content">
          {renderSafeString(room.prompt)}
        </div>
      </div>
    </div>
  </div>
</a>

<style lang="scss">
  .room-listing-item {
    color: white;
    text-decoration: none;
    display: grid;
    grid-template-columns: 390px 1fr;
    gap: 12px;
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
    background-color: var(--background-semi-transparent);
    position: relative;

    .depleted-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: var(--z-mid);
    }

    &:hover {
      background-color: var(--background);

      :global(.fake-background) {
        fill: var(--color-grey-darker);
      }
    }

    .room-listing-left {
      height: 200px;

      .room-stats {
        height: 100%;
        margin-bottom: 10px;
      }

      .profit-indicator {
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--default-border-style);
        padding: 5px;
        color: var(--white);

        &.positive {
          color: var(--background);
          background-color: var(--color-success);
        }

        &.negative {
          color: var(--background);
          background-color: var(--color-death);
        }
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
    }

    &.depleted {
      .room-listing-left,
      .room-info {
        opacity: 0.4;
      }
    }
  }
</style>
