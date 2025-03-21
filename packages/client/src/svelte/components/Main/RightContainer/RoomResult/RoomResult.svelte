<script lang="ts">
  import { onMount } from "svelte"
  import type { ServerReturnValue } from "@components/Main/RightContainer/RoomResult/types"
  import { player, rooms as roomsState } from "@modules/state/base/stores"
  import { enterRoom } from "@svelte/components/Main/RightContainer/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"
  import Log from "@components/Main/RightContainer/RoomResult/Log/Log.svelte"
  import Outcome from "@components/Main/RightContainer/RoomResult/Outcome.svelte"

  import { getUIState } from "@svelte/modules/ui/state.svelte"

  const { rooms } = getUIState()

  export let environment: ENVIRONMENT
  export let roomId: string | null

  let room = $roomsState[roomId ?? ""]

  let outcome: ServerReturnValue | undefined = undefined

  let oldRoomBalance = room.balance

  function close() {
    rooms.back()
  }

  onMount(async () => {
    if (!roomId) return
    outcome = await enterRoom(
      environment,
      $walletNetwork,
      roomId,
      $player.ownedRat
    )
  })
</script>

<div class="room-result">
  <!-- DESCRIPTION -->
  <div class="description">
    {room.roomPrompt}
  </div>

  {#if outcome && (outcome.log?.length ?? 0 > 0)}
    <!-- LOG -->
    <Log log={outcome.log} />

    <!-- OUTCOME -->
    <Outcome {room} {outcome} {oldRoomBalance} />
    <div class="return">
      <button onclick={close}>Return to nest</button>
    </div>
  {:else}
    EXPERIMENT IN PROGRESS: <Spinner />
  {/if}
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: 10000;
    padding: 20px;
    font-size: var(--font-size-normal);
    overflow-y: auto;

    .description {
      margin-bottom: 20px;
      background: var(--color-alert);
      color: var(--black);
      max-width: 800px;
      padding: 10px;
    }
  }

  button {
    padding: 10px;
    background: var(--color-alert);
    margin-top: 20px;
    cursor: pointer;
  }
</style>
