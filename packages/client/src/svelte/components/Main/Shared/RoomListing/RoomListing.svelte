<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import {
    rooms as roomStore,
    roomsOnCurrentLevel,
    playerRooms,
  } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { entriesByPopularity, entriesChronologically } from "./sortFunctions"
  import { filterRooms, filterDepletedRooms } from "./filterFunctions"
  import { blockNumber } from "@modules/network"

  import RoomItem from "@components/Main/Shared/RoomItem/RoomItem.svelte"
  import RoomPreview from "@components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import OwnRoomItem from "@components/Main/Shared/OwnRoomItem/OwnRoomItem.svelte"
  import RoomFilters from "./RoomFilters.svelte"
  import FloorHeader from "./FloorHeader.svelte"

  let {
    isOwnRoomListing,
  }: {
    isOwnRoomListing: boolean
  } = $props()

  let { rooms } = getUIState()
  const { myPreviewId, previewId } = rooms

  // Local state
  let currentRoom = $state<Hex | null>(null)
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
    console.log("active list filtering")

    return roomList.filter(r => r[1].creationBlock <= lastChecked)
  })

  let previewing = $derived(
    (isOwnRoomListing && $myPreviewId) || (!isOwnRoomListing && $previewId)
  )

  // Update currentroom with a delay to allow animations to play
  $effect(() => {
    if (isOwnRoomListing) {
      if (!$myPreviewId) {
        setTimeout(() => (currentRoom = $myPreviewId as Hex), 400)
      } else {
        currentRoom = $myPreviewId as Hex
      }
    }
  })

  $effect(() => {
    if (!isOwnRoomListing) {
      if (!$previewId) {
        setTimeout(() => (currentRoom = $previewId as Hex), 400)
      } else {
        currentRoom = $previewId as Hex
      }
    }
  })
</script>

<div class="wrapper">
  <div class="rooms">
    <div class="floor-content">
      <div
        class:previewing
        class:animated={rooms.previewAnimated}
        class="room-listing"
      >
        {#if !isOwnRoomListing}
          <FloorHeader />
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
      <div
        class:previewing
        class:animated={rooms.previewAnimated}
        class="room-preview"
      >
        {#if currentRoom}
          <RoomPreview
            {isOwnRoomListing}
            roomId={currentRoom}
            room={$roomStore?.[currentRoom]}
          />
        {:else}
          <div>ERROR: NO CURRENT ROOM</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .wrapper {
    position: relative;
    height: calc(100% - 60px);
    overflow: hidden;
  }

  .rooms {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    transition: grid-template-rows 0.1s ease;
  }

  .floor-content {
    position: relative;
  }

  .room-listing {
    overflow-y: scroll;
    padding-bottom: 200px;
  }

  .new-rooms-button {
    width: 100%;
    background-color: var(--color-alert-priority);
    color: var(--black);
    height: 3rem;
    border: none;
    outline: none;
  }

  .room-preview,
  .room-listing {
    position: absolute;
    width: 100%;
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    inset: 0;

    &.animated {
      transition: transform 0.2s ease 0.1s;
    }
  }

  .room-preview {
    left: 100%;
  }

  .previewing {
    transform: translateX(-100%);
  }

  .empty-listing {
    height: calc(100% - 100px);
    background: var(--background);
    color: var(--foreground);
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
