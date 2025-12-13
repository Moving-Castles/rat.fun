<script lang="ts">
  import {
    ratLeaderboard,
    killsLeaderboard,
    tripLeaderboard,
    ratLeaderboardMode,
    tripLeaderboardMode
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
  }

  function handleTripModeChange(value: string) {
    tripLeaderboardMode.set(value as "active" | "all_time")
  }
</script>

<div class="leaderboard">
  <LeaderboardSection
    title="Most Valuable Rat"
    toggleOptions={ratModeOptions}
    toggleValue={$ratLeaderboardMode}
    onToggleChange={handleRatModeChange}
  >
    {#if $ratLeaderboard.length === 0}
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
    {#if $killsLeaderboard.length === 0}
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
    {#if $tripLeaderboard.length === 0}
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
