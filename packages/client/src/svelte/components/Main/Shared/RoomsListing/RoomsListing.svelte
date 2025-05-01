<script lang="ts">
  import type { Hex } from "viem"
  import RoomItem from "@components/Main/Shared/RoomItem/RoomItem.svelte"
  import RoomPreview from "@components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import { rooms as roomsStore, playerRooms } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { tippy } from "svelte-tippy"
  import {
    entriesChronologically,
    entriesByVisit,
    entriesByBalance,
    entriesByKillCount,
  } from "./sortFunctions"

  let {
    isOwnRoomListing,
  }: {
    isOwnRoomListing: boolean
  } = $props()

  let { rooms } = getUIState()
  const { myPreviewId, previewId } = rooms

  // Local state
  let currentRoom = $state<Hex | null>(null)
  let sortKey = $state("c")
  let showDepletedRooms = $state(false)
  let textFilter = $state("")

  let sortFunction = $state(entriesChronologically)

  const sortBy = (key: string) => {
    sortKey = key
  }

  let roomsList = $derived.by(() => {
    let entries = isOwnRoomListing
      ? Object.entries($playerRooms)
      : Object.entries($roomsStore)

    // Filter out rooms with zero balance unless showDepletedRooms is true
    if (!showDepletedRooms) {
      entries = entries.filter(([_, room]) => Number(room.balance || 0) > 0)
    }

    return entries.filter(filter).sort(sortFunction)
  })

  let previewing = $derived(
    (isOwnRoomListing && $myPreviewId) || (!isOwnRoomListing && $previewId)
  )

  let filter = ([_, room]: [string, Room]) => {
    if (textFilter.length > 0)
      return room.roomPrompt.toLowerCase().includes(textFilter.toLowerCase())
    else return true
  }

  $effect(() => {
    switch (sortKey) {
      case "c":
        sortFunction = entriesChronologically
        break
      case "v":
        sortFunction = entriesByVisit
        break
      case "b":
        sortFunction = entriesByBalance
        break
      case "k":
        sortFunction = entriesByKillCount
        break
    }
  })

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
      <div class:previewing class="room-listing">
        {#if !isOwnRoomListing}
          {@const array = Object.values(roomsList)}
          <div class="floor-header">
            <!-- ROOM COUNTER -->
            <div
              use:tippy={{
                content: `There are ${array.length} rooms on your floor`,
              }}
              class="floor-stats"
            >
              {array.length} room{array.length > 1 ? "s" : ""}
            </div>
            <!-- TEXT FILTER -->
            <div class="text-filter">
              <input
                placeholder="Filter"
                class:active={textFilter.length > 0}
                type="text"
                name="filter"
                bind:value={textFilter}
                id=""
              />
              {#if textFilter !== ""}
                <button
                  class="sort-button close"
                  onclick={() => (textFilter = "")}>X</button
                >
              {/if}
            </div>
            <!-- FLOOR NAME -->
            <!-- <div class="floor-title">Floor {$ratLevelIndex * -1}</div> -->
            <!-- SORT BUTTONS -->
            <div class="floor-filter">
              <!-- SORT BY CHRONOLOGICAL -->
              <button
                use:tippy={{
                  placement: "top",
                  content: "sort chronologically",
                }}
                class:active={sortKey === "c"}
                class="sort-button"
                onclick={() => sortBy("c")}
              >
                C
              </button>
              <!-- SORT BY VISIT -->
              <button
                use:tippy={{
                  placement: "top",
                  content: "sort by visit",
                }}
                class:active={sortKey === "v"}
                class="sort-button"
                onclick={() => sortBy("v")}
              >
                V
              </button>
              <!-- SORT BY BALANCE -->
              <button
                use:tippy={{
                  placement: "top",
                  content: "sort by balance",
                }}
                class:active={sortKey === "b"}
                class="sort-button"
                onclick={() => sortBy("b")}
              >
                $
              </button>
              <!-- SORT BY KILLCOUNT -->
              <button
                use:tippy={{
                  placement: "top",
                  content: "sort by kill count",
                }}
                class:active={sortKey === "k"}
                class="sort-button"
                onclick={() => sortBy("k")}
              >
                K
              </button>
              <span class="divider"></span>
              <!-- SHOW DEPELETED ROOMS -->

              <button
                class="sort-button"
                class:active={showDepletedRooms}
                use:tippy={{
                  placement: "top",
                  content: "show depleted rooms",
                }}
                onclick={() => (showDepletedRooms = !showDepletedRooms)}
              >
                D
              </button>
            </div>
          </div>
        {:else}
          <div></div>
        {/if}
        {#if roomsList.length > 0}
          {#each roomsList as [roomId, room]}
            <RoomItem {roomId} {room} {isOwnRoomListing} />
          {/each}
        {:else}
          <div class="empty-listing">
            <div>NO ROOMS</div>
          </div>
        {/if}
      </div>
      <div class:previewing class="room-preview">
        {#if currentRoom}
          <RoomPreview
            {isOwnRoomListing}
            roomId={currentRoom}
            room={$roomsStore?.[currentRoom]}
          />
        {:else}
          <div>ERROR: NO CURRENT ROOM</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  input[type="text"] {
    color: black;
    background: var(--color-grey-dark);
    border: none;
    outline: none;
    font-family: var(--font-mono);
    height: 20px;
    line-height: 22px;

    &.active {
      background: var(--color-alert);
    }
  }

  input[type="text"]::placeholder {
    color: grey;
    font-family: var(--font-mono);
  }

  .wrapper {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  .floor-header {
    line-height: 60px;
    border-bottom: var(--default-border-style);
    padding-inline: 20px;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    position: sticky;
    top: 0;
    background: black;
  }

  .text-filter {
    position: relative;
    top: -2px;
  }

  .rooms {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    transition: grid-template-rows 0.1s ease;

    &.collapsed {
      grid-template-rows: 0px 1fr;

      .floor-header {
        border-bottom: 1px solid transparent;
      }
    }
  }

  .floor-content {
    position: relative;
  }

  .room-listing {
    overflow-y: scroll;
    padding-bottom: 200px;
  }

  .room-preview,
  .room-listing {
    position: absolute;
    width: 100%;
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    inset: 0;
    transition: transform 0.2s ease 0.1s;
  }

  .room-preview {
    left: 100%;
  }

  .sort-button {
    background: var(--color-grey-light);
    color: black;
    border: none;
    height: 20px;
    line-height: 22px;
    aspect-ratio: 1/1;

    &.close {
      position: absolute;
      top: 50%;
      height: 21px;
      right: 0;
      transform: translateY(-50%);
    }

    &.active {
      background: white;
    }
  }

  .previewing {
    transform: translateX(-100%);
  }

  .floor-stats {
    font-size: var(--font-size-small);
    width: 10ch;
  }

  .empty-listing {
    height: calc(100% - 100px);
    background: black;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .divider {
    background: var(--color-grey-light);
    width: 1px;
    height: 20px;
    margin-inline: 10px;
    display: inline-block;
    position: relative;
    top: 4px;
  }
</style>
