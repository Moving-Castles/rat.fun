<script lang="ts">
  import { rat, rats, gameConfig, levels } from "@modules/state/base/stores"

  import { shortenAddress } from "@modules/utils"
  import { EMPTY_CONNECTION } from "@modules/utils/constants"
  import { CurrentRoomId, UILocation } from "@modules/ui/stores"
  import { LOCATION } from "@modules/ui/enums"

  export let room: Room
  export let roomId: string

  function submitOnePlayer() {
    CurrentRoomId.set(roomId)
    UILocation.set(LOCATION.ROOM)
  }
</script>

<div class="room-item" class:disabled={$rat?.dead || room.balance == 0}>
  <button on:click={submitOnePlayer}>
    ROOM #{room.index}
  </button>
  <div class="room-info">
    <!-- Prompt -->
    <div class="prompt">{room.roomPrompt}</div>
    <!-- Balance -->
    <div class="balance">Balance: ${room.balance ?? 0}</div>
    <!-- Creator -->
    <div class="creator">
      Creator: {room.owner === $gameConfig.gameConfig.adminId
        ? "Jimmy9"
        : shortenAddress(room.owner)}
    </div>
    <!-- Room level -->
    <div class="creator">
      Level: {$levels[room.level]?.index ?? 0}
    </div>
  </div>
</div>

<style lang="scss">
  .room-item {
    display: flex;
    width: 100%;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    button {
      display: block;
      width: 200px;
      padding: 20px;
      font-size: var(--font-size-large);
      margin-top: 20px;
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
    margin-top: 20px;
    font-size: var(--font-size-normal);
    width: 100%;
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
</style>
