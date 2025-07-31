<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import type { PlotPoint } from "$lib/components/Shared/RoomGraph/types"
  import { RoomGraph } from "$lib/components/Shared"

  let { roomOutcomes, sanityRoomContent }: { roomOutcomes?: Outcome[]; sanityRoomContent: any } =
    $props()

  let plotData: PlotPoint[] = $derived.by(() => {
    if (!roomOutcomes) {
      return []
    }
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

<div class="room-preview-stats">
  <div class="header">ROOM BALANCE OVER TIME</div>
  <div class="content" class:empty={plotData.length == 1}>
    <RoomGraph height={300} {plotData} isEmpty={plotData.length == 1} />
  </div>
</div>

<style lang="scss">
  .room-preview-stats {
    background: var(--background-semi-transparent);

    .header {
      border-top: 1px solid var(--color-grey-mid);
      border-left: 1px solid var(--color-grey-mid);
      border-right: 1px solid var(--color-grey-mid);
      border-bottom: 1px dashed var(--color-grey-mid);
      padding: 12px;
      display: flex;
      justify-content: space-between;
      top: 0;
      background: var(--background);
      font-size: var(--font-size-small);
      overflow: hidden;
    }

    .content {
      height: 300px;
      border-right: 1px solid var(--color-grey-mid);

      &.empty {
        height: 300px;
      }
    }
  }
</style>
