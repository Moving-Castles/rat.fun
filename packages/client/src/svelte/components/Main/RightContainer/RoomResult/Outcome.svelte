<script lang="ts">
  import { fade } from "svelte/transition"

  import type { ServerReturnValue } from "@components/Main/RightContainer/RoomResult/types"

  export let outcome: ServerReturnValue
  export let room: Room
  export let oldRoomBalance

  import DraggableEntity from "@components/Main/Shared/Entities/DraggableEntity.svelte"

  import { gameConfig } from "@modules/state/base/stores"
  import { shortenAddress } from "@modules/utils"
</script>

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
      <div class="stat-change" class:negative={outcome.statChanges.health < 0}>
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
        {trait.name}
        {JSON.stringify(trait, null, 2)}
        <!-- <TraitItem {trait} /> -->
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
        {trait.name}
        {JSON.stringify(trait, null, 2)}
        <!-- <TraitItem {trait} /> -->
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
        {item.name}
        {JSON.stringify(item, null, 2)}
        <!-- <InventoryItem {item} /> -->
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
        {item.name}
        {JSON.stringify(item, null, 2)}
        <!-- <InventoryItem {item} /> -->
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
  {#if room.owner !== $gameConfig.gameConfig.adminId}
    <div class="outcome-item">
      <div class="title">
        Creator fee (${$gameConfig.gameConfig.creatorFee}) paid to
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
</div>

<style lang="scss">
  .outcome {
    max-width: 500px;
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
