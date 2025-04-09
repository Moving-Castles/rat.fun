<script lang="ts">
  import { frozenRoom } from "@svelte/components/Main/RoomResult/state.svelte"
</script>

<div class="room-info-box">
  <!-- INFO -->
  {#if $frozenRoom}
    <div class="column">
      <div class="image-container">
        <img src="/images/room3.jpg" alt={$frozenRoom.name} />
      </div>
      <div class="room-name">**{$frozenRoom.name}**</div>
    </div>
    <!-- PROMPT -->
    <div class="column">
      <div class="room-description">{$frozenRoom.roomPrompt}</div>
    </div>
    <!-- STATS -->
    <div class="column">
      <div class="room-balance">BALANCE:${$frozenRoom.balance}</div>
      <div class="room-visitor-count">VISITORS: {$frozenRoom.visitCount}</div>
      <div class="room-player-count">
        KILL RATE: {((Number($frozenRoom.killCount) || 0) /
          (Number($frozenRoom.visitCount) || 1)) *
          100}%
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .room-info-box {
    width: 50%;
    height: 100%;
    border: 1px solid white;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .image-container {
    width: 100px;
    height: 100px;
    border: 1px solid white;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .column {
    width: calc(100% / 3);
    padding: 10px;
    border-right: 1px dashed white;
  }
</style>
