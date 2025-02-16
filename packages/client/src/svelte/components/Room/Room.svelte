<script lang="ts">
  import { onMount } from "svelte"
  import type { ServerReturnValue } from "@components/Room/types"
  import { player, rooms } from "@modules/state/base/stores"
  import { enterRoom } from "@components/Room"
  import { UILocation } from "@modules/ui/stores"
  import { LOCATION } from "@modules/ui/enums"
  import { ENVIRONMENT } from "@mud/enums"
  import { ROOM_TYPE } from "contracts/enums"
  import { walletNetwork } from "@modules/network"

  import Spinner from "@components/Elements/Spinner/Spinner.svelte"
  import Log from "@components/Room/Log/Log.svelte"
  import Outcome from "@components/Room/Outcome.svelte"

  export let environment: ENVIRONMENT
  export let roomId: string | null

  let room = $rooms[roomId ?? ""]

  let outcome: ServerReturnValue | undefined = undefined

  let oldRoomBalance = room.balance

  function close() {
    UILocation.set(LOCATION.NEST)
  }

  onMount(async () => {
    if (!roomId) return

    outcome = await enterRoom(
      environment,
      $walletNetwork,
      ROOM_TYPE.ONE_PLAYER,
      roomId,
      $player.ownedRat
    )
  })
</script>

<div class="room">
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
      <button on:click={close}>Return to nest</button>
    </div>
  {:else}
    EXPERIMENT IN PROGRESS: <Spinner />
  {/if}
</div>

<style lang="scss">
  .room {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--black);
    color: var(--white);
    z-index: 10000;
    padding: 20px;
    font-size: var(--font-size-normal);
    overflow-y: auto;

    .description {
      font-size: var(--font-size-large);
      margin-bottom: 20px;
      background: var(--color-alert);
      color: var(--black);
      max-width: 800px;
      padding: 10px;
    }
  }

  button {
    padding: 10px;
    font-size: var(--font-size-large);
    background: var(--color-alert);
    margin-top: 20px;
    cursor: pointer;
  }
</style>
