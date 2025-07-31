<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import { roomsOnCurrentLevel, playerRooms } from "$lib/modules/state/stores"
  import { entriesByPopularity, entriesChronologically } from "./sortFunctions"
  import { filterRooms, filterDepletedRooms } from "./filterFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { RoomItem, OwnRoomItem, RoomFilters } from "$lib/components/Shared"

  let {
    isOwnRoomListing
  }: {
    isOwnRoomListing: boolean
  } = $props()

  let sortFunction = $state(entriesByPopularity)
  let showDepletedRooms = $state(isOwnRoomListing ? true : false)
  let textFilter = $state("")
  let lastChecked = $state<number>(Number(get(blockNumber)))

  const updateRooms = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Here we add once there are a couple of updates
  let roomList = $derived.by(() => {
    let entries = isOwnRoomListing
      ? Object.entries($playerRooms)
      : Object.entries($roomsOnCurrentLevel)

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

<div class="content">
  <div class:previewing class:animated={false} class="room-listing">
    {#if !isOwnRoomListing}
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
    {/if}

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
            {roomList.length - activeList.length} new rooms added
          </button>
        {/key}
      {/if}
      {#each activeList as roomEntry (roomEntry[0])}
        {#if isOwnRoomListing}
          <OwnRoomItem roomId={roomEntry[0] as Hex} room={roomEntry[1]} />
        {:else}
          <RoomItem roomId={roomEntry[0] as Hex} room={roomEntry[1]} />
        {/if}
      {/each}
    {:else}
      <div class="empty-listing">
        <div>
          {#if isOwnRoomListing}
            NO ROOMS CREATED YET
          {:else}
            NO ROOMS
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .content {
    position: relative;
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    max-height: 100%;
  }

  .room-listing {
    height: 100%;
    max-height: 100%;
  }

  .new-rooms-button {
    width: 100%;
    background-color: var(--color-alert-priority);
    color: var(--black);
    height: 3rem;
    border: none;
    outline: none;
  }

  .room-listing {
    width: 100%;
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    min-height: 100%;
    inset: 0;

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
