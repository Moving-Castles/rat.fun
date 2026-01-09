<script lang="ts">
  import type { TripFolder } from "@sanity-types"
  import type { Snippet } from "svelte"
  import TripFolderItem from "./TripFolderItem.svelte"
  import ChallengeFolderItem from "./ChallengeFolderItem.svelte"
  import { FEATURES } from "$lib/config/features"

  let {
    folders,
    foldersCounts,
    onselect,
    showCounts = true,
    disabled = false,
    children,
    restrictedFolder,
    restrictedFolderCount,
    challengeTripId,
    challengeTripAttempts,
    dailyChallengeTime,
    nextChallengeDay,
    challengeTitle,
    lastWinnerName,
    lastWinTimestamp
  }: {
    folders: TripFolder[]
    foldersCounts: number[]
    onselect: (str: string) => void
    showCounts?: boolean
    disabled?: boolean
    children?: Snippet
    restrictedFolder?: TripFolder
    restrictedFolderCount?: number
    challengeTripId?: string
    challengeTripAttempts?: number
    dailyChallengeTime?: string | null
    nextChallengeDay?: string | null // Date in YYYY-MM-DD format, or null for tomorrow
    challengeTitle?: string | null
    lastWinnerName?: string | null
    lastWinTimestamp?: number | null
  } = $props()
</script>

<div class="tiles">
  {@render children?.()}
  {#if restrictedFolder}
    {#if FEATURES.ENABLE_CHALLENGE_TRIPS}
      <ChallengeFolderItem
        listingIndex={0}
        folder={restrictedFolder}
        {challengeTripId}
        attemptCount={challengeTripAttempts}
        {dailyChallengeTime}
        {nextChallengeDay}
        {challengeTitle}
        {lastWinnerName}
        {lastWinTimestamp}
      />
    {:else}
      <TripFolderItem
        listingIndex={0}
        folder={restrictedFolder}
        count={restrictedFolderCount ?? 0}
        {showCounts}
        {disabled}
        restricted={true}
        onclick={() => {
          onselect(restrictedFolder._id)
        }}
      />
    {/if}
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
    margin: 10px;

    @media (max-width: 800px) {
      grid-template-columns: 1fr;
      grid-auto-rows: 120px;
      height: auto;
      min-height: 0;
      gap: 5px;
    }
  }
</style>
