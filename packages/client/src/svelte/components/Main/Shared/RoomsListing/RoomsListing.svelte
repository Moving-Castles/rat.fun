<script lang="ts">
  import RoomItem from "@svelte/components/Main/Shared/RoomItem/RoomItem.svelte"
  import RoomPreview from "@svelte/components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import { PANE } from "@modules/ui/enums"
  import {
    roomsOnRatLevel,
    ratLevelIndex,
    playerRooms,
  } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"

  let {
    pane,
    yours, // if we are listing your own rooms
  }: {
    pane: PANE
    yours: boolean
  } = $props()

  let { rooms, panes } = getUIState()
  const { current } = rooms

  // Local state
  let currentRoom = $state<string | null>(null)
  let sortKey = $state("c")

  const entriesChronologically = (a, b) => {
    return Number(b[1]?.index || 0) - Number(a[1].index || 0)
  }

  const entriesByVisit = (a, b) => {
    const aVisitCount = Number(a[1]?.visitCount || 0)
    const bVisitCount = Number(b[1]?.visitCount || 0)
    return bVisitCount - aVisitCount
  }

  const entriesByBalance = (a, b) => {
    return Number(b[1].balance || 0) - Number(a[1].balance || 0)
  }

  const entriesByKillRate = (a, b) => {
    const aVisitCount = Number(a[1]?.visitCount || 0)
    const aKillCount = Number(a[1]?.killCount || 0)
    const bVisitCount = Number(b[1]?.visitCount || 0)
    const bKillCount = Number(b[1]?.killCount || 0)

    const aKillRate = aKillCount / aVisitCount
    const bKillRate = bKillCount / bVisitCount

    return bKillRate - aKillRate
  }

  let sortFunction = $state(entriesChronologically)

  const sortBy = key => {
    sortKey = key
  }

  let roomsList = $derived.by(() => {
    console.log(sortFunction)
    if (!yours) {
      return Object.entries($roomsOnRatLevel).sort(sortFunction)
    } else {
      return Object.entries($playerRooms).sort(sortFunction)
    }
  })

  let previewing = $derived(panes.previewing === pane)

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
        sortFunction = entriesByKillRate
        break
    }
  })

  // Update currentroom with a delay to allow animations to play
  $effect(() => {
    if (!$current) {
      // Delayed
      setTimeout(() => (currentRoom = $current), 400)
    } else {
      // Instant
      currentRoom = $current
    }
  })
</script>

<div class="wrapper">
  <div class="rooms">
    <div class="floor-content">
      <div class:previewing class="room-listing">
        {#if !yours && $ratLevelIndex > -1}
          <div class="floor-header">
            <div class="floor-title">Floor {$ratLevelIndex * -1}</div>
            <div class="floor-stats">
              {Object.values($roomsOnRatLevel).length} rooms
            </div>
            <div class="floor-filter">
              <button
                class:active={sortKey === "c"}
                class="sort-button"
                onclick={() => sortBy("c")}>C</button
              >
              <button
                class:active={sortKey === "v"}
                class="sort-button"
                onclick={() => sortBy("v")}>V</button
              >
              <button
                class:active={sortKey === "b"}
                class="sort-button"
                onclick={() => sortBy("b")}>B</button
              >
              <button
                class:active={sortKey === "k"}
                class="sort-button"
                onclick={() => sortBy("k")}>K</button
              >
            </div>
          </div>
        {:else}
          <div></div>
        {/if}
        {#each roomsList as [roomId, room]}
          <RoomItem {roomId} {room} {yours} />
        {/each}
      </div>
      <div class:previewing class="room-preview">
        {#if currentRoom}
          <RoomPreview
            {yours}
            roomId={currentRoom}
            room={$roomsOnRatLevel[currentRoom]}
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
    height: 100%;
    overflow: hidden;
  }

  .floor-header {
    line-height: 60px;
    border-bottom: 1px solid white;
    padding-inline: 20px;
    display: flex;
    justify-content: space-between;
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
    background: white;
    color: black;
    border: none;
    padding: 0.5ch;

    &.active {
      background: var(--color-alert);
    }
  }
  .previewing {
    transform: translateX(-100%);
  }
</style>
