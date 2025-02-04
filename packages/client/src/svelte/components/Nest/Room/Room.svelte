<script lang="ts">
  import { fade } from "svelte/transition"
  import { createEventDispatcher } from "svelte"

  import type { ServerReturnValue } from "../types"

  import Spinner from "@components/Spinner/Spinner.svelte"
  import InventoryItem from "@components/Nest/Inventory/InventoryItem.svelte"
  import TraitItem from "@components/Nest/Traits/TraitItem.svelte"
  import Log from "@components/Nest/Log/Log.svelte"
  import { gameConfig } from "@svelte/modules/state/base/stores"
  import { shortenAddress } from "@svelte/modules/utils"

  export let outcome: ServerReturnValue
  export let room: Room

  let oldRoomBalance = room.balance

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
  <Log log={outcome.log} />

  <!-- OUTCOME -->
  {#if outcome.log?.length ?? 0 > 0}
    <div
      class="outcome"
      in:fade={{ duration: 200, delay: 500 * outcome.log.length + 1 }}
    >
      <!-- Changes to health -->
      <div class="outcome-item">
        <div class="title">__Stat changes</div>
        {#if !outcome?.statChanges.health || outcome.statChanges.health == 0}
          <div class="empty">** NONE **</div>
        {:else}
          <div
            class="stat-change"
            class:negative={outcome.statChanges.health < 0}
          >
            health: {outcome.statChanges.health}
          </div>
        {/if}
      </div>

      <!-- Added traits-->
      <div class="outcome-item">
        <div class="title">__ Added traits</div>
        {#if outcome.traitChanges.filter(tC => tC.type === "add").length === 0}
          <div class="empty">** NONE **</div>
        {:else}
          {#each outcome.traitChanges.filter(tC => tC.type === "add") as trait}
            <TraitItem {trait} />
          {/each}
        {/if}
      </div>

      <!-- Removed traits -->
      <div class="outcome-item">
        <div class="title">__ Removed traits</div>
        {#if outcome.traitChanges.filter(tC => tC.type === "remove").length === 0}
          <div class="empty">** NONE **</div>
        {:else}
          {#each outcome.traitChanges.filter(tC => tC.type === "remove") as trait}
            <TraitItem {trait} />
          {/each}
        {/if}
      </div>

      <!-- Added items-->
      <div class="outcome-item">
        <div class="title">__ Added items</div>
        {#if outcome.itemChanges.filter(iC => iC.type === "add").length === 0}
          <div class="empty">** NONE **</div>
        {:else}
          {#each outcome.itemChanges.filter(iC => iC.type === "add") as item}
            <InventoryItem {item} />
          {/each}
        {/if}
      </div>

      <!-- Removed items -->
      <div class="outcome-item">
        <div class="title">__ Removed items</div>
        {#if outcome.itemChanges.filter(iC => iC.type === "remove").length === 0}
          <div class="empty">** NONE **</div>
        {:else}
          {#each outcome.itemChanges.filter(iC => iC.type === "remove") as item}
            <InventoryItem {item} />
          {/each}
        {/if}
      </div>

      <!-- Balance transferred to/from rat-->
      <div class="outcome-item">
        <div class="title">Balance transfer to/from rat</div>
        {#if outcome.balanceTransfer === 0}
          <div class="empty">** NONE **</div>
        {:else}
          <div class="balance">${outcome.balanceTransfer}</div>
        {/if}
      </div>

      <!-- Creator fee payout-->
      {#if room.owner !== $gameConfig.adminId}
        <div class="outcome-item">
          <div class="title">
            Creator fee (${$gameConfig.creatorFee}) paid to
          </div>
          <div class="creator">{shortenAddress(room.owner)}</div>
        </div>
      {/if}

      <!-- Old room balance -->
      <div class="outcome-item">
        <div class="title">Old room balance</div>
        <div class="balance">${oldRoomBalance}</div>
      </div>

      <!-- New room balance -->
      <div class="outcome-item">
        <div class="title">New room balance</div>
        <div class="balance">${room.balance}</div>
      </div>

      <div class="return">
        <button on:click={close}>Return to nest</button>
      </div>
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

    .outcome {
      max-width: 500px;
    }

    button {
      padding: 10px;
      font-size: var(--font-size-large);
      background: var(--color-alert);
      margin-top: 20px;
      cursor: pointer;
    }

    .stat-change {
      display: inline-block;
      padding: 10px;
      margin-right: 10px;
      background: var(--color-health);

      &.negative {
        background: var(--color-death);
      }
    }
  }

  .outcome-item {
    padding-top: 10px;
    margin-top: 5px;
    margin-bottom: 5px;
    padding-bottom: 5px;
    border-top: 1px solid var(--color-grey-dark);
  }

  .outcome {
    font-size: var(--font-size-normal);
  }

  .empty {
    color: var(--color-grey-mid);
  }

  .balance {
    display: inline-block;
    padding: 10px;
    background: var(--color-value);
    color: var(--black);
  }

  .creator {
    display: inline-block;
    padding: 10px;
    background: var(--color-secondary);
    color: var(--black);
  }

  .title {
    margin-bottom: 5px;
  }
</style>
