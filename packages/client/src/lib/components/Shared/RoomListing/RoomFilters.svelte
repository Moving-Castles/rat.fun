<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { rooms as roomStore } from "$lib/modules/state/base/stores"
  import {
    entriesChronologically,
    entriesByVisit,
    entriesByBalance,
    entriesByKillCount,
    entriesByPopularity
  } from "./sortFunctions"

  let {
    textFilter,
    sortFunction,
    showDepletedRooms,
    onSort,
    onTextFilterChange,
    onTextFilterClear,
    onToggleDepleted,
    roomsAmount
  } = $props<{
    textFilter: string
    sortFunction: (a: [string, any], b: [string, any]) => number
    showDepletedRooms: boolean
    onSort: (fn: (a: [string, any], b: [string, any]) => number) => void
    onTextFilterChange: (value: string) => void
    onTextFilterClear: () => void
    onToggleDepleted: () => void
    roomsAmount: number
  }>()
</script>

<div class="floor-header">
  <!-- ROOM COUNTER -->
  <div
    use:tippy={{
      content: `There are ${Object.keys($roomStore).length} rooms on your floor`
    }}
    class="floor-stats"
  >
    {roomsAmount} room{roomsAmount === 0 || roomsAmount > 1 ? "s" : ""}
  </div>
  <!-- TEXT FILTER -->
  <div class="text-filter">
    <input
      placeholder="Filter"
      class:active={textFilter.length > 0}
      type="text"
      name="filter"
      bind:value={textFilter}
      oninput={e => onTextFilterChange(e.currentTarget.value)}
    />
    {#if textFilter !== ""}
      <button class="sort-button close" onclick={onTextFilterClear}>X</button>
    {/if}
  </div>
  <!-- SORT BUTTONS -->
  <div class="floor-filter">
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
    <!-- SHOW DEPELETED ROOMS -->
    <button
      class="sort-button"
      class:active={showDepletedRooms}
      use:tippy={{
        placement: "top",
        content: "show depleted rooms"
      }}
      onclick={onToggleDepleted}
    >
      D
    </button>
  </div>
</div>

<style lang="scss">
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

  .floor-header {
    line-height: 60px;
    border-bottom: var(--default-border-style);
    padding-inline: 20px;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    position: sticky;
    top: 0;
    // top: 61px; // respecting the floor header component above it
    z-index: var(--z-high);
    background: var(--background);
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

  .floor-stats {
    font-size: var(--font-size-small);
    width: 10ch;
  }

  .floor-filter {
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
</style>
