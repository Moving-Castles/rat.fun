<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { rat, rats } from "@modules/state/base/stores"
  import { newEvent } from "@modules/off-chain-sync/stores"

  import type { ServerReturnValuePvP } from "../types"

  import Spinner from "@components/Elements/Spinner/Spinner.svelte"
  import Log from "@components/Nest/Log/Log.svelte"
  import Outcome from "./Outcome.svelte"

  export let outcome: ServerReturnValuePvP
  export let room: Room

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

  const dispatch = createEventDispatcher()

  function close() {
    dispatch("close")
  }
</script>

<div class="room">
  <!-- DESCRIPTION -->
  <div class="description">
    {room.roomPrompt}
  </div>

  <!-- LOG -->
  <Log log={outcome.log} />

  <!-- OUTCOME -->
  {#if outcome.log?.length ?? 0 > 0}
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
