<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { SlideToggle } from "$lib/components/Shared"
  import {
    ratLeaderboard,
    killsLeaderboard,
    tripLeaderboard,
    ratLeaderboardMode,
    tripLeaderboardMode,
    ratLeaderboardLoading,
    killsLeaderboardLoading,
    tripLeaderboardLoading,
    loadAllLeaderboards,
    loadRatLeaderboard,
    loadTripLeaderboard
  } from "../state.svelte"
  import LeaderboardEntry from "./LeaderboardEntry.svelte"

  type Category = "kills" | "rats" | "trips"

  let selectedCategory = $state<Category>("kills")

  const modeOptions = [
    { value: "active", label: "Active" },
    { value: "all_time", label: "All Time" }
  ]

  // Get current mode based on category
  let currentMode = $derived(
    selectedCategory === "rats" ? $ratLeaderboardMode : $tripLeaderboardMode
  )

  // Check if current category has mode toggle
  let hasModeToggle = $derived(selectedCategory !== "kills")

  function handleCategoryChange(category: Category) {
    selectedCategory = category
  }

  function handleModeChange(value: string) {
    if (selectedCategory === "rats") {
      ratLeaderboardMode.set(value as "alive" | "all_time")
      loadRatLeaderboard()
    } else if (selectedCategory === "trips") {
      tripLeaderboardMode.set(value as "active" | "all_time")
      loadTripLeaderboard()
    }
  }

  onMount(() => {
    loadAllLeaderboards()
  })
</script>

<div class="leaderboard" in:fade|global={{ duration: 300 }}>
  <div class="category-tabs">
    <button
      class="category-tab"
      class:active={selectedCategory === "kills"}
      onclick={() => handleCategoryChange("kills")}
    >
      Rats killed
    </button>
    <button
      class="category-tab"
      class:active={selectedCategory === "rats"}
      onclick={() => handleCategoryChange("rats")}
    >
      Most valuable rats
    </button>
    <button
      class="category-tab"
      class:active={selectedCategory === "trips"}
      onclick={() => handleCategoryChange("trips")}
    >
      Most valuable trips
    </button>
  </div>

  {#if hasModeToggle}
    <div class="mode-toggle">
      <SlideToggle options={modeOptions} value={currentMode} onchange={handleModeChange} compact />
    </div>
  {/if}

  <div class="leaderboard-content">
    {#if selectedCategory === "kills"}
      {#if $killsLeaderboardLoading}
        <div class="empty-state">Loading...</div>
      {:else if $killsLeaderboard.length === 0}
        <div class="empty-state">No data available</div>
      {:else}
        {#each $killsLeaderboard as entry (entry.playerId)}
          <LeaderboardEntry
            rank={entry.rank}
            name={entry.playerName}
            value={entry.kills}
            valueLabel="kills"
          />
        {/each}
      {/if}
    {:else if selectedCategory === "rats"}
      {#if $ratLeaderboardLoading}
        <div class="empty-state">Loading...</div>
      {:else if $ratLeaderboard.length === 0}
        <div class="empty-state">No data available</div>
      {:else}
        {#each $ratLeaderboard as entry (entry.id)}
          <LeaderboardEntry
            rank={entry.rank}
            name={entry.name}
            subtitle="Owner: {entry.ownerName}"
            value={entry.value}
          />
        {/each}
      {/if}
    {:else if selectedCategory === "trips"}
      {#if $tripLeaderboardLoading}
        <div class="empty-state">Loading...</div>
      {:else if $tripLeaderboard.length === 0}
        <div class="empty-state">No data available</div>
      {:else}
        {#each $tripLeaderboard as entry (entry.tripId)}
          <LeaderboardEntry
            rank={entry.rank}
            name={entry.tripTitle}
            subtitle="Owner: {entry.ownerName}"
            value={entry.balance}
          />
        {/each}
      {/if}
    {/if}
  </div>
</div>

<style lang="scss">
  .leaderboard {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .category-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-grey-dark);
  }

  .category-tab {
    flex: 1;
    padding: 12px 8px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-small);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-grey-light);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--foreground);
    }

    &.active {
      color: var(--foreground);
      border-bottom-color: var(--foreground);
    }
  }

  .mode-toggle {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-grey-dark);
  }

  .leaderboard-content {
    flex: 1;
    overflow-y: auto;
  }

  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-grey-light);
    font-size: var(--font-size-small);
  }
</style>
