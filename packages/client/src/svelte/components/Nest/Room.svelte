<script lang="ts">
  import { fade } from "svelte/transition"
  import { createEventDispatcher } from "svelte"

  import type { ServerReturnValue } from "./types"

  import Ellipsis from "@components/Nest/Ellipsis.svelte"
  import InventoryItem from "./Inventory/InventoryItem.svelte"
  import TraitItem from "./Traits/TraitItem.svelte"

  export let outcome: ServerReturnValue
  export let room: Room

  $: console.log("outcome", outcome)

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
    {#each outcome.log as event, i}
      <div class="event" in:fade={{ duration: 200, delay: 500 * i }}>
        {event}
      </div>
    {/each}
  </div>

  <!-- OUTCOME -->
  {#if outcome.log?.length ?? 0 > 0}
    <div
      class="outcome"
      in:fade={{ duration: 200, delay: 500 * outcome.log.length + 1 }}
    >
      <!-- Changes to health -->
      <div class="stat-changes">
        {#each Object.entries(outcome.statChanges) as [stat, change]}
          {#if change !== 0}
            <div class="stat-change" class:negative={change < 0}>
              {stat}: {change}
            </div>
          {/if}
        {/each}
      </div>

      <!-- New items  -->
      <div class="new-items">
        <div class="new-items">
          <pre>New items</pre>
          {#each outcome.newItems as item}
            <InventoryItem {item} />
          {/each}
        </div>
      </div>

      <!-- Added traits-->
      <div class="added-traits">
        <pre>Added traits</pre>
        {#each outcome.traitChanges.filter(tC => tC.type === "add") as trait}
          <TraitItem {trait} />
        {/each}
      </div>

      <!-- Removed traits -->
      <div class="removed-traits">
        <pre>Removed traits</pre>
        {#each outcome.traitChanges.filter(tC => tC.type === "remove") as trait}
          <TraitItem {trait} />
        {/each}
      </div>

      <!-- $ transferred to player -->
      <div class="transferred">
        <pre>Balance transfer to player</pre>
        <div>${outcome.balanceTransfer}</div>
      </div>

      <!-- New room balance -->
      <div class="new-room-balance">
        <pre>New room balance</pre>
        <div>{room.balance}</div>
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
    font-size: 16px;

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

  .new-items,
  .added-traits,
  .removed-traits,
  .transferred,
  .new-room-balance {
    margin-top: 20px;
    border-top: 1px solid white;
  }

  pre {
    font-size: 12px;
    margin-bottom: 10px;
    margin-top: 10px;
    background: white;
    color: black;
    padding: 2px;
  }

  .outcome {
    font-size: 10px !important;
  }
</style>
