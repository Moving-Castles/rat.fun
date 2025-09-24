<script lang="ts">
  import type { PlotPoint } from "$lib/components/Room/RoomGraph/types"
  import { SmallButton } from "$lib/components/Shared"
  import { RoomGraph } from "$lib/components/Room"
  import { goto } from "$app/navigation"
  import { playerLiquidatedRooms } from "$lib/modules/state/stores"
  import { entriesChronologically } from "$lib/components/Room/RoomListing/sortFunctions"
  import { blocksToReadableTime } from "$lib/modules/utils"
  import { blockNumber } from "$lib/modules/network"
  import { staticContent } from "$lib/modules/content"

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

    console.log(entries)

    return entries.sort(sortFunction)
  })
</script>

<div class="admin-trip-table-container">
  {#if roomList?.length > 0}
    <table class="admin-trip-table">
      <thead>
        <tr>
          <td><!-- Trip --></td>
          <td>$SLOP</td>
          <td>P&L</td>
          <td>Age</td>
          <td>Spark</td>
          <td><!-- Action --></td>
        </tr>
      </thead>
      <tbody>
        {#each roomList as roomEntry (roomEntry[0])}
          {@const room = roomEntry[1]}
          {@const plotData = plots[roomEntry[0]]}
          <tr
            onmouseenter={() => {
              focus = roomEntry[0]
            }}
            onmouseleave={() => {
              focus = ""
            }}
            onclick={() => {
              goto("/admin/" + roomEntry[0], { noScroll: false })
            }}
            class="simple-row"
          >
            <td class="cell-description">{room.prompt}</td>
            <td class="cell-balance">{room.balance}</td>
            <td class="cell-profit-loss">{room.roomCreationCost - room.balance}</td>
            <td class="cell-age">
              {blocksToReadableTime(Number($blockNumber) - Number(room.creationBlock))}
            </td>
            <td class="cell-graph">
              {console.log(plotData)}
              {#if plotData}
                <div class="mini-graph">
                  <RoomGraph smallIcons height={80} {plotData} isEmpty={plotData.length === 0} />
                </div>
              {:else}
                <div class="mini-graph" />
              {/if}
            </td>
            <td class="cell-actions">
              <SmallButton text="Liquidate" onclick={() => {}}></SmallButton>
            </td>
          </tr>
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
    background: black;
    height: 400px;
    overflow-y: scroll;
    position: relative;
  }
  .admin-trip-table {
    width: 100%;
    background: black;
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

  .simple-row {
    * {
      border: none;
      outline: none;
      border-width: 0;
      border-bottom: 1px solid #555;
    }
    &:hover {
      background: #222;
      cursor: pointer;
    }
    td {
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
</style>
