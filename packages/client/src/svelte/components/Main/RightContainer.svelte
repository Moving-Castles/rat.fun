<script lang="ts">
  import { onMount } from "svelte"
  import { rooms } from "@svelte/modules/state/base/stores"
  import RoomItem from "./RoomItem.svelte"
  onMount(() => {
    console.log("RightContainer component mounted")
  })
</script>

<div class="right-container">
  <div class="floor-header">FLOOR 1</div>
  <div class="room-listing">
    {#each Object.values($rooms) as room}
      <RoomItem {room} />
    {/each}
  </div>
</div>

<style>
  .right-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
    height: calc(100% - 60px);
  }

  .floor-header {
    height: 60px;
    line-height: 60px;
    border-bottom: 1px solid white;
    padding-inline: 20px;
  }

  .room-listing {
    display: flex;
    flex-direction: column;
    height: calc(100% - 60px);
    overflow-y: auto;
  }
</style>
