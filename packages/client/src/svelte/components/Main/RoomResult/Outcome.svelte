<script lang="ts">
  import { fade } from "svelte/transition"

  import type { ServerReturnValue } from "@components/Main/RoomResult/types"

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
  {#if outcome?.healthChange && outcome.healthChange.amount !== 0}
    <div class="outcome-item">
      <div class="title">__Stat changes</div>
      <div class="stat-change" class:negative={outcome.healthChange.amount < 0}>
        health: {outcome.healthChange}
      </div>
    </div>
  {/if}

  <!-- Added traits-->
  {#if outcome.traitChanges.filter(tC => tC.type === "add").length !== 0}
    <div class="outcome-item">
      <div class="title">__ Added traits</div>
      {#each outcome.traitChanges.filter(tC => tC.type === "add") as trait}
        <DraggableEntity
          type="trait"
          address={trait.id ?? ""}
          fallback={trait}
        />
      {/each}
    </div>
  {/if}

  <!-- Removed traits -->
  {#if outcome.traitChanges.filter(tC => tC.type === "remove").length !== 0}
    <div class="outcome-item">
      <div class="title">__ Removed traits</div>
      {#each outcome.traitChanges.filter(tC => tC.type === "remove") as trait}
        <DraggableEntity
          type="trait"
          address={trait.id ?? ""}
          fallback={trait}
        />
      {/each}
    </div>
  {/if}

  <!-- Added items-->
  {#if outcome.itemChanges.filter(iC => iC.type === "add").length !== 0}
    <div class="outcome-item">
      <div class="title">__ Added items</div>
      {#each outcome.itemChanges.filter(iC => iC.type === "add") as item}
        <DraggableEntity type="item" address={item.id ?? ""} fallback={item} />
      {/each}
    </div>
  {/if}

  <!-- Removed items -->
  {#if outcome.itemChanges.filter(iC => iC.type === "remove").length !== 0}
    <div class="outcome-item">
      <div class="title">__ Removed items</div>
      {#each outcome.itemChanges.filter(iC => iC.type === "remove") as item}
        <DraggableEntity type="item" address={item.id ?? ""} fallback={item} />
      {/each}
    </div>
  {/if}

  <!-- Balance transferred to/from rat-->
  {#if (outcome?.balanceTransfer?.amount ?? 0) !== 0}
    <div class="outcome-item">
      <div class="title">Balance transfer to/from rat</div>
      <div class="balance">${outcome.balanceTransfer.amount}</div>
    </div>
  {/if}

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
