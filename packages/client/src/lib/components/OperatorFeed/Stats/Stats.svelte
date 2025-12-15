<script lang="ts">
  import { worldStats } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import Leaderboard from "./Leaderboard.svelte"

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
</script>

<div class="stats">
  <div class="section-header">
    <span class="title">Stats</span>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <span class="stat-label">Trips</span>
      <span class="stat-value">{$worldStats?.globalTripIndex?.toString() ?? "—"}</span>
    </div>
    <div class="stat-box">
      <span class="stat-label">Dead rats</span>
      <span class="stat-value">{$worldStats?.globalRatKillCount?.toString() ?? "—"}</span>
    </div>
    <div class="stat-box">
      <span class="stat-label">Last death</span>
      <span class="stat-value">{timeSinceDeathText}</span>
    </div>
  </div>

  <div class="section-header">
    <span class="title">Leaderboards</span>
  </div>

  <Leaderboard />
</div>

<style lang="scss">
  .stats {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background);
  }

  .section-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: var(--default-border-style);
    background: var(--background);

    @media (max-width: 800px) {
      padding: 8px 12px;
    }
  }

  .title {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 16px;
    border-bottom: var(--default-border-style);

    @media (max-width: 800px) {
      gap: 8px;
      padding: 12px;
    }
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    border: 1px solid var(--color-grey-dark);
    background: var(--background);
    gap: 4px;
  }

  .stat-label {
    font-size: var(--font-size-small);
    color: var(--color-grey-light);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-large);
  }
</style>
