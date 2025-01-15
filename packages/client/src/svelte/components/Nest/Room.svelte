<script lang="ts">
  import { fade } from "svelte/transition"
  import { createEventDispatcher } from "svelte"
  import type { ServerReturnValue } from "./types"

  import Ellipsis from "./Ellipsis.svelte"

  export let outcome: ServerReturnValue
  export let room: Room

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
  <div class="log">
    {#each outcome.eventLog as event, i}
      <div class="event" in:fade={{ duration: 200, delay: 500 * i }}>
        {event}
      </div>
    {/each}
  </div>

  <!-- OUTCOME -->
  {#if outcome.eventLog?.length ?? 0 > 0}
    <div
      class="outcome"
      in:fade={{ duration: 200, delay: 500 * outcome.eventLog.length + 1 }}
    >
      <div class="trait">Trait added: {outcome.newTrait}</div>
      <div class="stat-changes">
        {#each Object.entries(outcome.statChanges) as [stat, change]}
          <div class="stat-change" class:negative={change < 0}>
            {stat}: {change}
          </div>
        {/each}
      </div>
      <div class="return">
        <button on:click={close}>Return to nest</button>
      </div>
    </div>
  {:else}
    <Ellipsis />
  {/if}
</div>

<style lang="scss">
  .room {
    font-family: "courier new", monospace;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    color: white;
    z-index: 10000;
    padding: 40px;
    font-size: 24px;

    .description {
      font-size: 24px;
      margin-bottom: 20px;
      background: yellow;
      color: black;
      max-width: 800px;
    }

    .log {
      margin-bottom: 20px;
    }

    .outcome {
      max-width: 800px;
    }

    .success {
      background: green;
    }

    .failure {
      color: red;
    }

    .trait {
      background: yellow;
      color: black;
      padding: 10px;
    }

    button {
      width: 50%;
      padding: 40px;
      font-size: 32px;
      margin-top: 20px;
      cursor: pointer;
    }

    .stat-change {
      display: inline-block;
      padding: 10px;
      margin: 10px;
      background: green;

      &.negative {
        background: red;
      }
    }
  }
</style>
