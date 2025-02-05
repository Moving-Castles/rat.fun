<script lang="ts">
  import { createEventDispatcher } from "svelte"

  import type { ServerReturnValue } from "../types"

  import Spinner from "@components/Spinner/Spinner.svelte"
  import Log from "@components/Nest/Log/Log.svelte"
  import Outcome from "./Outcome.svelte"

  export let outcome: ServerReturnValue
  export let room: Room

  let oldRoomBalance = room.balance

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
