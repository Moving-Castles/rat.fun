<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  let { roomId, room } = $props()

  let { rooms } = getUIState()
</script>

<button onclick={rooms.back}>🔙 {room.name}</button>
<div class="room-preview" onclick={() => rooms.goto(roomId)}>
  <div class="room-info">
    <div class="room-name">**{room.name}**</div>
    <div class="room-visitor-count">Visitors: {room.visitorCount}</div>
    <div class="room-balance">Balance: ${room.balance}</div>
  </div>
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
