<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import { rooms, playerRooms, playerIsNew } from "$lib/modules/state/stores"
  import { entriesByPopularity, entriesChronologically } from "./sortFunctions"
  import { filterRooms, filterDepletedRooms } from "./filterFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { AdminRoomItem } from "$lib/components/Admin"
  import { RoomItem, RoomFilters } from "$lib/components/Room"

  let {
    isOwnRoomListing
  }: {
    isOwnRoomListing: boolean
  } = $props()

  let sortFunction = $state(entriesChronologically)
  let showDepletedRooms = $state(isOwnRoomListing ? true : false)
  let textFilter = $state("")
  let lastChecked = $state<number>(Number(get(blockNumber)))

  const updateRooms = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Here we add once there are a couple of updates
  let roomList = $derived.by(() => {
    let entries = isOwnRoomListing ? Object.entries($playerRooms) : Object.entries($rooms)

    entries = filterDepletedRooms(entries, showDepletedRooms)
    entries = filterRooms(entries, textFilter)
    return entries.sort(sortFunction)
  })

  let activeList = $derived.by(() => {
    // activeList
    if (lastChecked > 0) {
      return roomList.filter(r => Number(r[1].creationBlock) <= lastChecked)
    } else {
      return roomList
    }
  })

  let previewing = $state(false)
</script>

<div class="content" id="room-listing-sanity-check">
  <div class:previewing class:animated={false} class="room-listing">
    {#if $playerIsNew}
      <div class="new-player-message">
        <div>Buy your first rat to start tripping.</div>
      </div>
    {:else}
      <!-- {#if !isOwnRoomListing}
        <RoomFilters
          roomsAmount={activeList.length}
          {textFilter}
          {sortFunction}
          {showDepletedRooms}
          onSort={fn => {
            sortFunction = fn
            updateRooms()
          }}
          onTextFilterChange={value => {
            textFilter = value
          }}
          onTextFilterClear={() => {
            textFilter = ""
          }}
          onToggleDepleted={() => {
            showDepletedRooms = !showDepletedRooms
          }}
        />
      {:else}
        <RoomFilters
          roomsAmount={activeList.length}
          {textFilter}
          {sortFunction}
          {showDepletedRooms}
          onSort={fn => {
            sortFunction = fn
            updateRooms()
          }}
          onTextFilterChange={value => {
            textFilter = value
          }}
          onTextFilterClear={() => {
            textFilter = ""
          }}
          onToggleDepleted={() => {
            showDepletedRooms = !showDepletedRooms
          }}
        />
      {/if} -->

      {#if activeList.length > 0}
        {#if activeList.length < roomList.length}
          {#key roomList.length}
            <button
              onclick={() => {
                sortFunction = entriesChronologically
                updateRooms()
              }}
              class="new-rooms-button flash-fast-thrice"
            >
              {roomList.length - activeList.length} new trips added
            </button>
          {/key}
        {/if}
        {#each activeList as roomEntry (roomEntry[0])}
          {#if isOwnRoomListing}
            <AdminRoomItem roomId={roomEntry[0] as Hex} room={roomEntry[1]} />
          {:else}
            <RoomItem roomId={roomEntry[0] as Hex} room={roomEntry[1]} />
          {/if}
        {/each}
      {:else}
        <div class="empty-listing">
          <div>
            {#if isOwnRoomListing}
              NO TRIPS CREATED YET
            {:else}
              NO TRIPS
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style lang="scss">
  .content {
    position: relative;
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    height: var(--game-window-height);
    max-height: 100%;
  }

  .new-rooms-button {
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
    font-family: var(--display-font-stack);
    font-size: var(--font-size-extra-large);
    line-height: 1em;
    text-align: center;
  }

  .room-listing {
    width: 100%;
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    min-height: 100%;
    inset: 0;
    height: 100%;
    max-height: 100%;
    // background-image: url("/images/texture-3.png");
    // background-size: 200px;

    &.animated {
      transition: transform 0.2s ease 0.1s;
    }
  }

  .previewing {
    transform: translateX(-100%);
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
