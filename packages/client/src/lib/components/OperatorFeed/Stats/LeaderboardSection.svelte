<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import type { LeaderboardEntry } from "../state.svelte"

  let {
    title,
    entries,
    showCurrency = false
  }: {
    title: string
    entries: LeaderboardEntry[]
    showCurrency?: boolean
  } = $props()
</script>

<div class="leaderboard-section">
  <div class="section-title">{title}</div>
  {#if entries.length === 0}
    <div class="empty">No data</div>
  {:else}
    {#each entries as entry (entry.id)}
      <div class="entry">
        <span class="rank">{entry.rank}.</span>
        <span class="owner">{entry.ownerName}</span>
        <span class="name">{entry.name}</span>
        <span class="value">{entry.value.toLocaleString()}</span>
        {#if showCurrency}
          <span class="currency">{CURRENCY_SYMBOL}</span>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style lang="scss">
  .leaderboard-section {
    padding: 0 12px;
    border-bottom: var(--default-border-style);
    padding-bottom: 12px;
  }

  .section-title {
    padding: 12px 0 6px;
    font-size: var(--font-size-small);
    color: var(--color-grey-light);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--color-grey-dark);
    margin-bottom: 6px;
  }

  .empty {
    padding: 12px;
    color: var(--color-grey-light);
    font-size: var(--font-size-small);
  }

  .entry {
    display: flex;
    align-items: baseline;
    padding: 4px 0;
    font-size: var(--font-size-small);
    gap: 6px;
  }

  .rank {
    color: var(--color-grey-light);
    min-width: 20px;
  }

  .owner {
    white-space: nowrap;
  }

  .name {
    color: var(--color-grey-lighter);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .value {
    color: var(--color-up);
    font-family: var(--mono-font-stack);
    white-space: nowrap;
  }

  .currency {
    color: var(--color-up);
    font-size: var(--font-size-tiny);
  }
</style>
