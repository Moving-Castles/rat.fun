<script lang="ts">
  import type { PlotPoint } from "$lib/components/Room/RoomGraph/types"
  import { derived } from "svelte/store"
  import { playerActiveRooms, profitLoss } from "$lib/modules/state/stores"
  import { entriesChronologically } from "$lib/components/Room/RoomListing/sortFunctions"
  import { staticContent } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import AdminTripTableRow from "./AdminTripTableRow.svelte"

  let { focus = $bindable(), pendingTrip } = $props()

  let sortFunction = $state(entriesChronologically)

  let plots: Record<string, PlotPoint[]> = $derived.by(() => {
    const result = Object.fromEntries(
      roomList.map(([roomId, room]) => {
        let sanityRoomContent = $staticContent?.rooms?.find(r => r.title == roomId)

        const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []
        // Sort the outcomes in order of creation
        outcomes.sort((a, b) => {
          return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
        })
        const roomOutcomes = outcomes.reverse()
        const value = [
          {
            time: 0,
            roomValue: Number(room.roomCreationCost),
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

        // Map the values
        return [roomId, value]
      })
    )
    return result
  })

  let roomList = $derived.by(() => {
    let entries = Object.entries($playerActiveRooms)

    return entries.sort(sortFunction)
  })

  const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
    if ($profitLoss === 0) return "neutral"
    return $profitLoss > 0 ? "upText" : "downText"
  })
</script>

<div class="admin-trip-table-container">
  <p class="table-summary">
    Active trips <span class={$portfolioClass}>({CURRENCY_SYMBOL}{$profitLoss})</span>
  </p>
  <table class="admin-trip-table">
    <thead>
      <tr>
        <th><!-- Trip --></th>
        <th>Visits</th>
        <th>Profit</th>
        <th>Age</th>
        <th>Spark</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Loading row for pending room creation -->
      {#if pendingTrip && !roomList.map(r => r[1].prompt).includes(pendingTrip.prompt)}
        <tr class="simple-row loading-row">
          <td class="cell-description">
            <p class="single-line">{pendingTrip.prompt}</p>
          </td>
          <td class="cell-balance">0</td>
          <td class="cell-profit-loss">0</td>
          <td class="cell-age">0</td>
          <td class="cell-graph">
            <div class="mini-graph loading-graph"></div>
          </td>
          <td class="cell-actions"> </td>
        </tr>
      {/if}
      <!-- --- -->
      {#each roomList as roomEntry (roomEntry[0])}
        <AdminTripTableRow
          id={roomEntry[0]}
          data={plots[roomEntry[0]]}
          room={roomEntry[1]}
          onpointerenter={() => {
            focus = roomEntry[0]
          }}
          onpointerleave={() => {
            focus = ""
          }}
        />
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  .admin-trip-table-container {
    width: 100%;
    background: black;
    height: 100%;
    overflow-y: scroll;
    position: relative;
  }
  .admin-trip-table {
    width: 100%;
    table-layout: fixed;
  }

  .table-summary {
    padding: 0 6px;
  }

  .no-data {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    justify-self: center;
    align-self: center;

    span {
      background: var(--color-death);
      padding: 2px;
      color: var(--background);
    }
  }

  .loading {
    height: 24px;
    width: 100%;
    background: red;
    display: block;
  }

  .loading-row {
    opacity: 0.6;
    background: #111;
    pointer-events: none;

    .loading-graph {
      height: 24px;
      width: 100%;
      background: repeating-linear-gradient(90deg, #333 0px, #444 10px, #333 20px);
      animation: loading-shimmer 1s infinite linear;
    }

    .loading-text {
      font-size: 12px;
    }
  }

  @keyframes loading-shimmer {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 20px 0;
    }
  }

  .cell-description {
    padding: 0 6px;
  }

  .single-line {
    margin: 0;
    padding: 0;
    border: none;
    max-width: 100%;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .downText {
    color: red;
  }

  .upText {
    color: #78ee72;
  }
</style>
