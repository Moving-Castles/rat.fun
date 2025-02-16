<script lang="ts">
  import { rat, rats, gameConfig, levels } from "@modules/state/base/stores"

  import { shortenAddress } from "@modules/utils"
  import { EMPTY_CONNECTION } from "@modules/utils/constants"
  import { ROOM_TYPE } from "contracts/enums"
  import { CurrentRoomId, UILocation } from "@modules/ui/stores"
  import { LOCATION } from "@modules/ui/enums"

  export let room: Room
  export let roomId: string

  function submitOnePlayer() {
    CurrentRoomId.set(roomId)
    UILocation.set(LOCATION.ROOM)
  }

  function submitTwoPlayer() {
    CurrentRoomId.set(roomId)
    UILocation.set(LOCATION.PVP_ROOM)
  }
</script>

<div class="room-item" class:disabled={$rat?.dead || room.balance == 0}>
  <button
    on:click={room.roomType === ROOM_TYPE.ONE_PLAYER
      ? submitOnePlayer
      : submitTwoPlayer}
  >
    ROOM #{room.index}
  </button>
  <div class="room-info" class:pvp={room.roomType === 1}>
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
    <!-- Room type -->
    <div class="creator">
      Room type: {room.roomType === 0 ? "1p" : "2p"}
    </div>
    <!-- Room level -->
    <div class="creator">
      Level: {$levels[room.level]?.index ?? 0}
    </div>
    <!-- Rat waiting in room  -->
    {#if room.ratInRoom && room.ratInRoom !== EMPTY_CONNECTION}
      <div class="creator">
        Rat in room: {$rats[room.ratInRoom]?.name ?? "unknown"}
      </div>
    {/if}
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
