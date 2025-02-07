<script lang="ts">
  import { gameConfig } from "@modules/state/base/stores"
  import { destroyRoomAsAdmin } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { shortenAddress } from "@modules/utils"

  export let room: Room
  export let roomId: string

  let busy = false

  async function sendDestroyRoom() {
    busy = true
    const action = destroyRoomAsAdmin(roomId)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }
</script>

<div class="room-item">
  <div class="room-info" class:pvp={room.roomType === 1}>
    <div class="room-title">Room #{room.index}</div>
    <!-- Prompt -->
    <div class="prompt">{room.roomPrompt}</div>

    <!-- Balance -->
    <div class="balance">Balance: ${room.balance ?? 0}</div>
    <!-- Creator -->
    <div class="creator">
      Creator: {room.owner === $gameConfig.adminId
        ? "Jimmy9"
        : shortenAddress(room.owner)}
    </div>
    <!-- Room type -->
    <div class="creator">
      Room type: {room.roomType === 0 ? "1p" : "2p"}
    </div>
    <!-- Room level -->
    <div class="creator">
      Level: {room.level}
    </div>
  </div>
  <button disabled={busy} on:click={sendDestroyRoom}>Destroy room</button>
</div>

<style lang="scss">
  .room-item {
    display: flex;
    width: 100%;
    margin-bottom: 20px;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    button {
      display: block;
      width: 200px;
      padding: 20px;
      font-size: var(--font-size-large);
      cursor: pointer;
      flex-shrink: 0;
      background: var(--color-secondary);

      &:active {
        background: var(--color-alert);
      }
    }
  }

  .room-info {
    padding: 20px;
    background: var(--color-grey-light);
    color: var(--black);
    font-size: var(--font-size-normal);

    &.pvp {
      background: var(--color-alert);
    }
  }

  .balance {
    padding: 10px;
    background: var(--color-value);
    color: var(--black);
    display: inline-block;
    margin-top: 10px;
  }

  .creator {
    padding: 10px;
    background: var(--color-grey-mid);
    color: var(--white);
    display: inline-block;
    margin-top: 10px;
  }

  .room-title {
    font-weight: bold;
    margin-bottom: 1em;
  }
</style>
