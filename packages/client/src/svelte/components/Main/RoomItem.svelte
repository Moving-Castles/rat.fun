<script lang="ts">
  import { onMount } from "svelte"

  export let room: Room

  onMount(() => {
    console.log("RoomItem component mounted")
  })
</script>

<div class="room-listing-item">
  <div class="room-info">
    <div class="room-name">**{room.name}**</div>
    <div class="room-visitor-count">Visitors: {room.visitorCount}</div>
    <div class="room-balance">Balance: ${room.balance}</div>
  </div>
  <!-- <div class="room-description">{room.roomPrompt}</div> -->
</div>

<style>
  .room-listing-item {
    border-bottom: 1px solid white;
    padding-inline: 20px;
    cursor: pointer;
    height: 120px;
    display: flex;
    align-items: center;

    &:hover {
      background-color: #222;
    }
  }
</style>
