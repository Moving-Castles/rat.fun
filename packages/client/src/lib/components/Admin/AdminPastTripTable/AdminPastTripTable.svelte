<script lang="ts">
  import type { PlotPoint } from "$lib/components/Room/RoomGraph/types"
  import { playerLiquidatedRooms, realisedProfitLoss } from "$lib/modules/state/stores"
  import { derived } from "svelte/store"
  import { entriesChronologically } from "$lib/components/Room/RoomListing/sortFunctions"
  import { staticContent } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import AdminTripTableRow from "../AdminTripTable/AdminTripTableRow.svelte"

  let { focus = $bindable() } = $props()

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
    let entries = Object.entries($playerLiquidatedRooms)

    return entries.sort(sortFunction)
  })

  const portfolioClass = derived([realisedProfitLoss], ([$realisedProfitLoss]) => {
    if ($realisedProfitLoss === 0) return "neutral"
    return $realisedProfitLoss > 0 ? "upText" : "downText"
  })
</script>

<div class="admin-trip-table-container">
  <p class="table-summary">
    Liquidated trips <span class={$portfolioClass}>({CURRENCY_SYMBOL}{$realisedProfitLoss})</span>
  </p>
  {#if roomList?.length > 0}
    <table class="admin-trip-table">
      <thead>
        <tr>
          <th><!-- Trip --></th>
          <th>Visits</th>
          <th>Profit</th>
          <th>Tax</th>
          <th>Spark</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        <!-- Adding new table entry -->
        <tr class="simple-row">
          <td colspan="5"></td>
        </tr>
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
  {:else}
    <div class="no-data">
      <span>NO DATA</span>
    </div>
  {/if}
</div>

<style lang="scss">
  .admin-trip-table-container {
    width: 100%;
    background: rgba(30, 30, 30, 1);
    height: 100%;
    overflow-y: scroll;
    position: relative;
  }
  .admin-trip-table {
    width: 100%;
    // background: black;
    table-layout: fixed;
    /* justify-content: center; */
    /* align-items: center; */
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

  .mini-graph {
    width: 200px;
    height: 80px;
    background: #222;
  }

  :global(.simple-row) {
    &:hover {
      background-color: var(--color-death);
      cursor: pointer;
    }
    td {
      outline: none;
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }
    .cell-description {
      padding: 0.6rem 0.5rem;
      // min-width: 500px;
    }
    .cell-balance {
      width: 120px;
      // background: red;
    }
    .cell-profit-loss {
      width: 120px;
    }
    .cell-age {
      width: 120px;
    }
    .cell-graph {
      max-width: 200px;
    }
    .cell-actions {
      max-width: 200px;
    }
  }

  .table-summary {
    padding: 0 6px;
  }

  .downText {
    color: red;
  }

  .upText {
    color: var(--graph-color-up);
  }
</style>
