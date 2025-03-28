<script lang="ts">
  import { ratTotalValue } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { shortenAddress } from "@modules/utils"
  let { roomId, room, yours } = $props()

  console.log(roomId, room, yours)

  let { rooms } = getUIState()
</script>

{#if room}
  <div class="room-preview">
    <button class="back-button" onclick={rooms.back}> ← {room.name}</button>

    <div class="room-info">
      <div class="room-balance">Balance: ${room.balance}</div>
      <div class="room-creator">Created by:{shortenAddress(room.owner)}</div>
    </div>

    <div class="room-stats">
      <div class="room-visitor-count">Visitors: {room.visitCount}</div>
      <div class="room-player-count">Success rate: 0%</div>
      <div class="room-player-count">
        Kill rate: {((Number(room.killCount) || 0) /
          (Number(room.visitCount) || 1)) *
          100}%
      </div>
    </div>

    <div class="room-prompt">
      {room.roomPrompt}
    </div>

    <div class="room-recent-events">TODO: RECENT EVENTS</div>

    {#if room.balance > 0 && $ratTotalValue > 0}
      <div class="room-enter">
        <button onclick={() => rooms.navigate("room", { roomId })}
          >ENTER ROOM</button
        >
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .room-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    word-break: break-all;
  }

  .back-button {
    width: 100%;
    height: 60px;
    background: transparent;
    border: none;
    color: white;
    text-transform: uppercase;
    border-bottom: 1px solid white;

    &:hover {
      background-color: #222;
    }
  }

  .room-info {
    padding: var(--default-padding);
  }

  .room-stats {
    padding: var(--default-padding);
  }

  .room-prompt {
    padding: var(--default-padding);
    background: var(--color-alert);
    margin: var(--default-padding);
  }

  .room-recent-events {
    padding: var(--default-padding);
  }

  .room-enter {
    padding: var(--default-padding);
  }

  button {
    width: 100%;
    height: 100%;
    background: var(--color-alert);
    padding: 20px;
  }
</style>
