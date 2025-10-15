<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import { fade } from "svelte/transition"
  import { trips, playerIsNew } from "$lib/modules/state/stores"
  import { entriesChronologically } from "./sortFunctions"
  import { filterTrips, filterDepletedTrips } from "./filterFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { TripItem } from "$lib/components/Trip"

  let sortFunction = $state(entriesChronologically)
  let showDepletedTrips = false
  let textFilter = $state("")
  let lastChecked = $state<number>(Number(get(blockNumber)))

  const updateTrips = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Here we add once there are a couple of updates
  let tripList = $derived.by(() => {
    let entries = Object.entries($trips)
    entries = filterDepletedTrips(entries, showDepletedTrips)
    entries = filterTrips(entries, textFilter)
    return entries.sort(sortFunction)
  })

  let activeList = $derived.by(() => {
    // activeList
    if (lastChecked > 0) {
      return tripList.filter(r => Number(r[1].creationBlock) <= lastChecked)
    } else {
      return tripList
    }
  })
</script>

<div class="content">
  <div class:animated={false} class="trip-listing" in:fade|global={{ duration: 300 }}>
    {#if $playerIsNew}
      <div class="new-player-message">
        <div>Buy your first rat to start tripping.</div>
      </div>
    {:else if activeList.length > 0}
      {#if activeList.length < tripList.length}
        {#key tripList.length}
          <button
            onclick={() => {
              sortFunction = entriesChronologically
              updateTrips()
            }}
            class="new-trips-button flash-fast-thrice"
          >
            {tripList.length - activeList.length} new trips added
          </button>
        {/key}
      {/if}
      {#each activeList as tripEntry (tripEntry[0])}
        <TripItem tripId={tripEntry[0] as Hex} trip={tripEntry[1]} />
      {/each}
    {:else}
      <div class="empty-listing">
        <div>NO TRIPS</div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .content {
    position: relative;
    overflow-y: scroll;
    height: var(--game-window-main-height);
    height: var(--game-window-height);
    max-height: 100%;
  }

  .new-trips-button {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    background-color: var(--color-alert-priority);
    color: var(--black);
    height: 3rem;
    border: none;
    outline: none;
  }

  .new-player-message {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    border: none;
    outline: none;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-normal);
    line-height: 1em;
    text-align: center;
  }

  .trip-listing {
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    min-height: 100%;
    max-height: 100%;
    inset: 0;
    width: 100%;

    &.animated {
      transition: transform 0.2s ease 0.1s;
    }
  }

  .empty-listing {
    height: calc(100% - 60px);
    display: flex;
    justify-content: center;
    align-items: center;

    div {
      background-color: var(--color-death);
      padding: 10px;
      color: var(--background);
    }
  }
</style>
