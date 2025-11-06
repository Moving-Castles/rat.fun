<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import type { TripFolder } from "@sanity-types"

  let {
    hasRat,
    eligibleCount,
    totalCount,
    tripFolders = [],
    selectedFolderId = $bindable("")
  }: {
    hasRat: boolean
    eligibleCount: number
    totalCount: number
    tripFolders: TripFolder[]
    selectedFolderId: string
  } = $props()
</script>

<div class="trip-header">
  <div class="header-text">
    {#if !hasRat || ratState.state.current === RAT_BOX_STATE.DEPLOYING_RAT}
      Buy rat to select trip.
    {:else}
      Select a trip. <span class="trips-count">
        {eligibleCount}/{totalCount} trip{totalCount === 0 || totalCount > 1 ? "s" : ""} available.
      </span>
    {/if}
  </div>
  {#if tripFolders.length > 0}
    <div class="folder-filter">
      <select bind:value={selectedFolderId}>
        {#each tripFolders as folder}
          <option value={folder._id}>{folder.title}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style lang="scss">
  .trip-header {
    line-height: 60px;
    height: 60px;
    border-bottom: var(--default-border-style);
    border-right: var(--default-border-style);
    padding-inline: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    position: fixed;
    top: 59px; // Below top bar
    width: var(--game-column-width);
    z-index: var(--z-high);
    background: var(--background-semi-transparent);

    @media (max-width: 700px) {
      width: 100%;
    }
  }

  .header-text {
    font-size: var(--font-size-normal);
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
  }

  .trips-count {
    color: var(--color-alert);
  }

  .folder-filter {
    select {
      padding: 5px 10px;
      border: none;
      background: var(--foreground);
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-normal);
      border-radius: 0;
      outline-color: var(--color-alert);
      outline-width: 1px;
      cursor: pointer;
      color: var(--background);
    }
  }
</style>
