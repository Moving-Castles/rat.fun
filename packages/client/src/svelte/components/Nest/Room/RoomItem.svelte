<script lang="ts">
  import { player, rat, gameConfig } from "@modules/state/base/stores"
  import type { ServerReturnValue, ServerReturnValuePvP } from "../types"
  import { walletNetwork } from "@modules/network"
  import { MESSAGE } from "@components/Nest/constants"
  import { ENVIRONMENT } from "@mud/enums"
  import { shortenAddress } from "@modules/utils"
  import { EMPTY_CONNECTION } from "@modules/utils/constants"

  import RoomComponent from "@components/Nest/Room/Room.svelte"
  import PvPRoomComponent from "@components/Nest/Room/PvPRoom.svelte"

  export let room: Room
  export let roomId: string
  export let environment: ENVIRONMENT

  let busy = false
  let outcome: ServerReturnValue | ServerReturnValuePvP
  let inRoom = false

  const submitOnePlayer = async () => {
    const startTime = performance.now()
    inRoom = true
    busy = true
    outcome = {}
    let url = "http://localhost:3131/room/enter"

    if ([ENVIRONMENT.GARNET].includes(environment)) {
      url = "https://reality-model-1.mc-infra.com/room/enter"
    }

    const signature = await $walletNetwork.walletClient.signMessage({
      message: MESSAGE,
    })

    const formData = new URLSearchParams()
    formData.append("signature", signature)
    formData.append("roomId", roomId)
    formData.append("ratId", $player.ownedRat)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      outcome = (await response.json()) as ServerReturnValue

      busy = false
      const endTime = performance.now()
      console.log(
        `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
      )
    } catch (err) {
      console.log(err)
      window.alert("An error occurred. Please try again.")
      busy = false
      inRoom = false
    }
  }

  const submitTwoPlayer = async () => {
    const startTime = performance.now()
    inRoom = true
    busy = true
    outcome = {}
    let url = "http://localhost:3131/room/enter-pvp"

    if ([ENVIRONMENT.GARNET].includes(environment)) {
      url = "https://reality-model-1.mc-infra.com/room/enter"
    }

    const signature = await $walletNetwork.walletClient.signMessage({
      message: MESSAGE,
    })

    const formData = new URLSearchParams()
    formData.append("signature", signature)
    formData.append("roomId", roomId)
    formData.append("ratId", $player.ownedRat)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      outcome = (await response.json()) as ServerReturnValue

      busy = false
      const endTime = performance.now()
      console.log(
        `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
      )
    } catch (err) {
      console.log(err)
      window.alert("An error occurred. Please try again.")
      busy = false
      inRoom = false
    }
  }

  const close = () => {
    inRoom = false
    busy = false
  }
</script>

<div class="room-item" class:disabled={$rat?.dead || room.balance == 0}>
  <button
    on:click={room.roomType === 0 ? submitOnePlayer : submitTwoPlayer}
    disabled={busy}>ROOM #{room.index}</button
  >
  <div class="room-info" class:pvp={room.roomType === 1}>
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
    <!-- Rat waiting in room  -->
    {#if room.ratInRoom && room.ratInRoom !== EMPTY_CONNECTION}
      <div class="creator">Rat in room: {shortenAddress(room.ratInRoom)}</div>
    {/if}
  </div>
</div>

{#if inRoom}
  {#if room.roomType === 0}
    <RoomComponent {outcome} {room} on:close={close} />
  {/if}
  {#if room.roomType === 1}
    <PvPRoomComponent {outcome} {room} on:close={close} />
  {/if}
{/if}

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
