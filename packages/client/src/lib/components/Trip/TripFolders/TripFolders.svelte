<script lang="ts">
  import type { TripFolder } from "@sanity-types"
  import type { Snippet } from "svelte"
  import TripFolderItem from "./TripFolderItem.svelte"
  import ChallengeFolderItem from "./ChallengeFolderItem.svelte"

  let {
    folders,
    foldersCounts,
    onselect,
    showCounts = true,
    disabled = false,
    children,
    restrictedFolder,
    challengeTripId,
    challengeTripAttempts,
    nextChallenge
  }: {
    folders: TripFolder[]
    foldersCounts: number[]
    onselect: (str: string) => void
    showCounts?: boolean
    disabled?: boolean
    children?: Snippet
    restrictedFolder?: TripFolder
    challengeTripId?: string
    challengeTripAttempts?: number
    nextChallenge?: string | null
  } = $props()
</script>

<div class="tiles">
  {@render children?.()}
  {#if restrictedFolder}
    <ChallengeFolderItem
      listingIndex={0}
      folder={restrictedFolder}
      {challengeTripId}
      attemptCount={challengeTripAttempts}
      {nextChallenge}
    />
  {/if}
  {#each folders as folder, i}
    <TripFolderItem
      listingIndex={restrictedFolder ? i + 1 : i}
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
    width: calc(100% - 20px);
    max-width: 100%;
    height: calc(100% - 80px);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    justify-items: stretch;
    align-items: stretch;
    align-content: start;
    gap: 10px;
    overflow-x: hidden;
    margin: 10px;
  }

  @media (max-width: 480px) {
    .tiles {
      grid-template-columns: 1fr;
      grid-auto-rows: 100px;
      height: auto;
      min-height: calc(100% - 60px);
    }
  }
</style>
