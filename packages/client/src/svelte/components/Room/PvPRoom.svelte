<script lang="ts">
  import { onMount } from "svelte"
  import type { ServerReturnValuePvP } from "@components/Room/types"
  import { player, rooms, rat, rats } from "@modules/state/base/stores"
  import { enterRoom } from "@components/Room"
  import { UILocation } from "@modules/ui/stores"
  import { LOCATION } from "@modules/ui/enums"
  import { ENVIRONMENT } from "@mud/enums"
  import { ROOM_TYPE } from "contracts/enums"
  import { walletNetwork } from "@modules/network"
  import { newEvent } from "@modules/off-chain-sync/stores"

  import Spinner from "@components/Elements/Spinner/Spinner.svelte"
  import Log from "@components/Room/Log/Log.svelte"
  import Outcome from "@components/Room/Outcome.svelte"

  export let environment: ENVIRONMENT
  export let roomId: string | null

  let room = $rooms[roomId ?? ""]

  let outcome: ServerReturnValuePvP | undefined = undefined

  let executionLog: string[] = [`${$rat.name} entered room`]
  let oldRoomBalance = room.balance

  $: if ($newEvent?.topic === "pvp__outcome") {
    outcome = $newEvent.message as ServerReturnValuePvP
    newEvent.set(null)
  }

  $: if ($newEvent?.topic === "pvp__update") {
    executionLog = [...executionLog, $newEvent.message as string]
    newEvent.set(null)
  }

  function close() {
    UILocation.set(LOCATION.NEST)
  }

  onMount(async () => {
    if (!roomId) return
    enterRoom(
      environment,
      $walletNetwork,
      ROOM_TYPE.TWO_PLAYER,
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
    <div class="outcome-container">
      <div class="column">
        <div class="alert">
          {$rats[outcome.ratA.id]?.name ?? "unknown"}
        </div>
        <Outcome {room} outcome={outcome.ratA} {oldRoomBalance} />
      </div>
      <div class="column">
        <div class="alert">
          {$rats[outcome.ratB.id]?.name ?? "unknown"}
        </div>
        <Outcome {room} outcome={outcome.ratB} {oldRoomBalance} />
      </div>
    </div>
    <div class="return">
      <button on:click={close}>Return to nest</button>
    </div>
  {:else}
    <div class="execution-log">
      {#each executionLog as logEntry}
        <div>{logEntry}</div>
      {/each}
    </div>
    <div>
      <Spinner />
    </div>
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

  .outcome-container {
    display: flex;
    justify-content: space-between;

    .column {
      width: 50%;
    }
  }

  .alert {
    display: inline-block;
    background: var(--color-alert);
    padding: 10px;
    padding-inline: 20px;
    color: var(--black);
  }
</style>
