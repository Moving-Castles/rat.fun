<script lang="ts">
  import type { TripFolder } from "@sanity-types"
  import type { Snippet } from "svelte"
  import TripFolderItem from "./TripFolderItem.svelte"

  let {
    folders,
    foldersCounts,
    onselect,
    showCounts = true,
    disabled = false,
    children
  }: {
    folders: TripFolder[]
    foldersCounts: number[]
    onselect: (str: string) => void
    showCounts?: boolean
    disabled?: boolean
    children?: Snippet
  } = $props()
</script>

<div class="tiles">
  {@render children?.()}
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
    gap: 10px;
    overflow-x: hidden;
  }

  @media (max-width: 480px) {
    .tiles {
      grid-template-columns: 1fr;
      grid-auto-rows: 80px;
      height: auto;
      min-height: calc(100% - 60px);
    }
  }
</style>
