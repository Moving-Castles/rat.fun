<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { trips as tripStore } from "$lib/modules/state/stores"
  import {
    entriesChronologically,
    entriesByVisit,
    entriesByBalance,
    entriesByKillCount,
    entriesByPopularity
  } from "./sortFunctions"
  import { typeHit } from "$lib/modules/sound"

  let {
    textFilter,
    sortFunction,
    showDepletedTrips,
    onSort,
    onTextFilterChange,
    onTextFilterClear,
    onToggleDepleted,
    tripsAmount
  } = $props<{
    textFilter: string
    sortFunction: (a: [string, any], b: [string, any]) => number
    showDepletedTrips: boolean
    onSort: (fn: (a: [string, any], b: [string, any]) => number) => void
    onTextFilterChange: (value: string) => void
    onTextFilterClear: () => void
    onToggleDepleted: () => void
    tripsAmount: number
  }>()
</script>

<div class="level-header">
  <!-- TRIP COUNTER -->
  <div
    use:tippy={{
      content: `There are ${Object.keys($tripStore).length} trips`
    }}
    class="level-stats"
  >
    {tripsAmount} trip{tripsAmount === 0 || tripsAmount > 1 ? "s" : ""}
  </div>
  <!-- TEXT FILTER -->
  <div class="text-filter">
    <input
      placeholder="Filter"
      class:active={textFilter.length > 0}
      type="text"
      name="filter"
      bind:value={textFilter}
      oninput={e => {
        typeHit()
        onTextFilterChange(e.currentTarget.value)
      }}
    />
    {#if textFilter !== ""}
      <button class="sort-button close" onclick={onTextFilterClear}>X</button>
    {/if}
  </div>
  <!-- SORT BUTTONS -->
  <div class="filters">
    <!-- SORT BY HOT -->
    <button
      use:tippy={{
        placement: "top",
        content: "sort by popularity"
      }}
      class:active={sortFunction === entriesByPopularity}
      class="sort-button"
      onclick={() => onSort(entriesByPopularity)}
    >
      P
    </button>
    <!-- SORT BY CHRONOLOGICAL -->
    <button
      use:tippy={{
        placement: "top",
        content: "sort chronologically"
      }}
      class:active={sortFunction === entriesChronologically}
      class="sort-button"
      onclick={() => onSort(entriesChronologically)}
    >
      C
    </button>
    <!-- SORT BY VISIT -->
    <button
      use:tippy={{
        placement: "top",
        content: "sort by visit"
      }}
      class:active={sortFunction === entriesByVisit}
      class="sort-button"
      onclick={() => onSort(entriesByVisit)}
    >
      V
    </button>
    <!-- SORT BY BALANCE -->
    <button
      use:tippy={{
        placement: "top",
        content: "sort by balance"
      }}
      class:active={sortFunction === entriesByBalance}
      class="sort-button"
      onclick={() => onSort(entriesByBalance)}
    >
      $
    </button>
    <!-- SORT BY KILLCOUNT -->
    <button
      use:tippy={{
        placement: "top",
        content: "sort by kill count"
      }}
      class:active={sortFunction === entriesByKillCount}
      class="sort-button"
      onclick={() => onSort(entriesByKillCount)}
    >
      K
    </button>
    <span class="divider"></span>
    <!-- SHOW DEPELETED TRIPS -->
    <button
      class="sort-button"
      class:active={showDepletedTrips}
      use:tippy={{
        placement: "top",
        content: "show depleted trips"
      }}
      onclick={onToggleDepleted}
    >
      D
    </button>
  </div>
</div>

<style lang="scss">
  .level-header {
    line-height: 60px;
    border-bottom: var(--default-border-style);
    padding-inline: 20px;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background: var(--background-semi-transparent);
  }

  .text-filter {
    position: relative;
    top: -2px;
  }

  .sort-button {
    background: var(--color-grey-light);
    color: var(--background);
    border: none;
    height: 20px;
    line-height: 22px;
    aspect-ratio: 1/1;

    &.close {
      position: absolute;
      top: 50%;
      height: 21px;
      right: 0;
      transform: translateY(-50%);
    }

    &.active {
      background: var(--color-alert);
      color: var(--foreground);
    }
  }

  .level-stats {
    font-size: var(--font-size-small);
    width: 10ch;
  }

  .filters {
    width: 28ch;
    text-align: right;
    white-space: nowrap;
  }

  .divider {
    background: var(--color-grey-light);
    width: 1px;
    height: 20px;
    margin-inline: 10px;
    display: inline-block;
    position: relative;
    top: 4px;
  }

  input[type="text"] {
    color: var(--background);
    background: var(--color-grey-light);
    border: none;
    outline: none;
    font-family: var(--font-mono);
    height: 20px;
    line-height: 22px;

    &.active {
      background: var(--color-alert);
      color: var(--foreground);
    }
  }

  input[type="text"]::placeholder {
    color: var(--color-grey-dark);
    font-family: var(--font-mono);
  }
</style>
