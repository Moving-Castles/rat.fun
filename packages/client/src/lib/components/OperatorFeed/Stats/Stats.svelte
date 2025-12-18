<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { worldStats } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import {
    activeRatsLeaderboard,
    cashedOutRatsLeaderboard,
    activeTripsLeaderboard,
    cashedOutTripsLeaderboard,
    leaderboardsLoading,
    startLeaderboardPolling,
    stopLeaderboardPolling
  } from "../state.svelte"
  import LeaderboardSection from "./LeaderboardSection.svelte"

  // Calculate time since last rat death
  let timeSinceDeathText = $derived.by(() => {
    const lastKilledBlock = $worldStats?.lastKilledRatBlock ?? 0n
    if (lastKilledBlock === 0n) return "—"

    const currentBlock = $blockNumber
    if (currentBlock === 0n) return "—"

    const blocksDiff = currentBlock - lastKilledBlock
    // Base has ~2 second blocks
    const secondsDiff = Number(blocksDiff) * 2

    if (secondsDiff < 60) return `${secondsDiff}s`
    if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)}m`
    if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)}h`
    return `${Math.floor(secondsDiff / 86400)}d`
  })

  onMount(() => {
    startLeaderboardPolling()
  })

  onDestroy(() => {
    stopLeaderboardPolling()
  })
</script>

<div class="stats">
  <!-- Compact stats row -->
  <div class="stats-row">
    <div class="stat">
      <span class="stat-label">Trips</span>
      <span class="stat-value">{$worldStats?.globalTripIndex?.toString() ?? "—"}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Dead</span>
      <span class="stat-value">{$worldStats?.globalRatKillCount?.toString() ?? "—"}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Last death</span>
      <span class="stat-value">{timeSinceDeathText}</span>
    </div>
  </div>

  <!-- Leaderboards -->
  <div class="leaderboards-header">
    <span>Leaderboards</span>
  </div>

  <div class="leaderboards-content">
    {#if $leaderboardsLoading}
      <div class="loading">Loading...</div>
    {:else}
      <LeaderboardSection title="Active Rats" entries={$activeRatsLeaderboard} />
      <LeaderboardSection title="Active Trips" entries={$activeTripsLeaderboard} />
      <LeaderboardSection
        title="Cashed Out Rats"
        entries={$cashedOutRatsLeaderboard}
        showCurrency
      />
      <LeaderboardSection
        title="Cashed Out Trips"
        entries={$cashedOutTripsLeaderboard}
        showCurrency
      />
    {/if}
  </div>
</div>

<style lang="scss">
  .stats {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background);
  }

  .stats-row {
    display: flex;
    border-bottom: var(--default-border-style);
    padding: 8px 12px;
    gap: 16px;
    display: none;
  }

  .stat {
    display: flex;
    gap: 6px;
    align-items: baseline;
  }

  .stat-label {
    font-size: var(--font-size-small);
    color: var(--color-grey-light);
    text-transform: uppercase;
  }

  .stat-value {
    font-family: var(--mono-font-stack);
    font-size: var(--font-size-small);
  }

  .leaderboards-header {
    padding: 10px 12px;
    border-bottom: var(--default-border-style);
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .leaderboards-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 20px;
  }

  .loading {
    padding: 12px;
    color: var(--color-grey-light);
    font-size: var(--font-size-small);
  }
</style>
