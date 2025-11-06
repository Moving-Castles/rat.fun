<script lang="ts">
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"
  let {
    folders,
    foldersCounts,
    legacyTrips = [],
    onselect,
    showCounts = true
  }: {
    folders: TripFolder[]
    foldersCounts: number[]
    legacyTrips: [string, Trip[]]
    onselect: (str: string) => void
    showCounts?: boolean
  } = $props()

  let legacyTripCount = $derived(legacyTrips.length)
  let totalAmount = $derived(foldersCounts.reduce((a, b) => a + b, 0) + legacyTripCount)

  const onmousedown = () => {
    playSound("ratfunUI", "smallButtonDown")
  }

  const onmouseup = (e: MouseEvent, i) => {
    if (showCounts && foldersCounts[i] == 0) {
      playSound("ratfunUI", "negative")
    } else {
      playSound("ratfunUI", "smallButtonUp")
    }
  }
</script>

<div class="tiles">
  {#each folders as folder, i}
    <div class="tile">
      <button
        style:background-image="url('/images/texture-{2 + (i % 5)}.png');"
        onclick={() => {
          if (foldersCounts[i] != 0 || !showCounts) {
            onselect(folder._id)
          }
        }}
        onmouseup={e => onmouseup(e, i)}
        {onmousedown}
        class="title"
      >
        {folder.title}
        {#if showCounts}
          <br />
          {foldersCounts[i]}/{totalAmount}
        {/if}
      </button>
    </div>
  {/each}

  {#if legacyTrips.length > 0}
    <div class="tile">
      <button
        class="title void"
        onclick={() => {
          onselect("legacy")
        }}
        onmouseup={e => onmouseup(e, i)}
        {onmousedown}
      >
        The void
        {#if showCounts}
          <br />
          (All other trips)
        {/if}
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .tiles {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(4, 1fr);
    place-content: center;
    padding: 30px;
    gap: 30px;

    .tile {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;

      .title {
        width: 100%;
        height: 100%;
        font-size: var(--font-size-normal);
        padding: 16px;

        &:active {
          filter: invert(1);
        }
      }
    }

    .void {
      background: rgb(40, 40, 40);
      color: white;
    }
  }
</style>
