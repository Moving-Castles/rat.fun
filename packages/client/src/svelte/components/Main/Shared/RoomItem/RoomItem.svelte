<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  let { roomId, room, yours } = $props()

  let { rooms, enums } = getUIState()
</script>

<button
  class="room-listing-item"
  class:disabled={room.balance <= 0}
  onclick={() =>
    rooms.preview(roomId, yours ? enums.PANE.LEFT : enums.PANE.RIGHT)}
>
  <!-- IMAGE -->
  <div class="room-image"></div>
  <!-- INFO -->
  <div class="room-info">
    <div class="room-name">**{room.name}**</div>
    <div class="room-visitor-count">Visitors: {room.visitCount}</div>
    <div class="room-balance">Balance: ${room.balance}</div>
  </div>
</button>

<style lang="scss">
  .room-listing-item {
    display: flex;
    align-items: center;
    background: transparent;
    outline: none;
    border: none;
    border-bottom: 1px solid white;
    padding-inline: 20px;
    cursor: pointer;
    height: 120px;
    width: 100%;
    color: white;
    text-align: left;

    &.disabled {
      background-color: #666;
    }

    &:hover {
      background-color: #222;
    }
  }

  .room-image {
    height: 80px;
    aspect-ratio: 1/1;
    background-color: rgb(36, 36, 36);
    margin-right: 20px;
  }
</style>
