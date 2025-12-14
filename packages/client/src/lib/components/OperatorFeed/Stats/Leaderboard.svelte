<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
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
  import LeaderboardSection from "./LeaderboardSection.svelte"
  import LeaderboardEntry from "./LeaderboardEntry.svelte"

  const ratModeOptions = [
    { value: "alive", label: "Alive" },
    { value: "all_time", label: "All Time" }
  ]

  const tripModeOptions = [
    { value: "active", label: "Active" },
    { value: "all_time", label: "All Time" }
  ]

  function handleRatModeChange(value: string) {
    ratLeaderboardMode.set(value as "alive" | "all_time")
    loadRatLeaderboard()
  }

  function handleTripModeChange(value: string) {
    tripLeaderboardMode.set(value as "active" | "all_time")
    loadTripLeaderboard()
  }

  onMount(() => {
    loadAllLeaderboards()
  })
</script>

<div class="leaderboard" in:fade|global={{ duration: 300 }}>
  <LeaderboardSection
    title="Most Valuable Rat"
    toggleOptions={ratModeOptions}
    toggleValue={$ratLeaderboardMode}
    onToggleChange={handleRatModeChange}
  >
    {#if $ratLeaderboardLoading}
      <div class="empty-state">Loading...</div>
    {:else if $ratLeaderboard.length === 0}
      <div class="empty-state">No data available</div>
    {:else}
      {#each $ratLeaderboard as entry (entry.id)}
        <LeaderboardEntry
          rank={entry.rank}
          name={entry.name}
          subtitle={entry.ownerName}
          value={entry.value}
        />
      {/each}
    {/if}
  </LeaderboardSection>

  <LeaderboardSection title="Most Rats Killed">
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
  </LeaderboardSection>

  <LeaderboardSection
    title="Most Valuable Trip"
    toggleOptions={tripModeOptions}
    toggleValue={$tripLeaderboardMode}
    onToggleChange={handleTripModeChange}
  >
    {#if $tripLeaderboardLoading}
      <div class="empty-state">Loading...</div>
    {:else if $tripLeaderboard.length === 0}
      <div class="empty-state">No data available</div>
    {:else}
      {#each $tripLeaderboard as entry (entry.tripId)}
        <LeaderboardEntry
          rank={entry.rank}
          name={entry.tripTitle}
          subtitle={entry.ownerName}
          value={entry.balance}
        />
      {/each}
    {/if}
  </LeaderboardSection>
</div>

<style lang="scss">
  .leaderboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-grey-light);
    font-size: var(--font-size-small);
  }
</style>
