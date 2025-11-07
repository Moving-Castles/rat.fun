<script lang="ts">
  import type { TripFolder } from "@sanity-types"
  import TripFolderItem from "./TripFolderItem.svelte"

  let {
    folders,
    foldersCounts,
    legacyTrips = [],
    onselect,
    showCounts = true,
    disabled = false
  }: {
    folders: TripFolder[]
    foldersCounts: number[]
    legacyTrips?: [string, Trip][]
    onselect: (str: string) => void
    showCounts?: boolean
    disabled?: boolean
  } = $props()
</script>

<div class="tiles">
  {#each folders as folder, i}
    <TripFolderItem
      listingIndex={i}
      {folder}
      count={foldersCounts[i]}
      {showCounts}
      {disabled}
      onclick={() => {
        onselect(folder._id)
      }}
    />
  {/each}

  {#if legacyTrips.length > 0}
    <TripFolderItem
      listingIndex={folders.length}
      isVoid={true}
      {showCounts}
      {disabled}
      onclick={() => onselect("legacy")}
    />
  {/if}
</div>

<style lang="scss">
  .tiles {
    width: 100%;
    max-width: 100%;
    height: calc(100% - 60px);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    justify-items: stretch;
    align-items: stretch;
    align-content: start;
    padding: 10px;
    gap: 10px;
    overflow-x: hidden;
  }

  @media (max-width: 480px) {
    .tiles {
      grid-template-columns: 1fr;
    }
  }
</style>
