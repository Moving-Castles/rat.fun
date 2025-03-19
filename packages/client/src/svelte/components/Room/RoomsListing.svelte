<script lang="ts">
  import RoomItem from "@components/Main/RoomItem.svelte"
  import RoomPreview from "@components/Main/RoomPreview.svelte"
  import { roomsOnRatLevel, ratLevelIndex } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"

  let { rooms } = getUIState()

  let currentRoom = $state<string | null>(null)

  const { current } = rooms

  $effect(() => {
    if (!$current) {
      // Delayed
      setTimeout(() => (currentRoom = $current), 400)
    } else {
      // Instant
      currentRoom = $current
    }
  })

  $inspect($roomsOnRatLevel)
</script>

<div class="floor-header">Floor {$ratLevelIndex * -1}</div>

<div class="rooms">
  <div class:previewing={$current} class="rooms-track">
    <div class="room-listing">
      {#each Object.entries($roomsOnRatLevel) as [roomId, room]}
        <RoomItem {roomId} {room} />
      {/each}
    </div>
    <div class="room-preview">
      {#if currentRoom}
        <RoomPreview
          roomId={currentRoom}
          room={$roomsOnRatLevel[currentRoom]}
        />
      {:else}
        <div>Empty</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .floor-header {
    height: 60px;
    line-height: 60px;
    border-bottom: 1px solid white;
    padding-inline: 20px;
  }

  .rooms {
    height: calc(100% - 60px);
    width: 100%;
    overflow: hidden;
  }

  .rooms-track {
    width: 200%;
    display: flex;
    flex-flow: row nowrap;
    transition: transform 0.4s ease;
  }

  .room-preview,
  .room-listing {
    display: flex;
    flex-direction: column;
    height: calc(100% - 60px);
    overflow-y: auto;
    flex-basis: 50%;
    flex-shrink: 0;
  }

  .previewing {
    transform: translateX(-50%);
  }
</style>
