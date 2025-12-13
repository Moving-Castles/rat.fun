<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let {
    rank,
    name,
    subtitle,
    value,
    valueLabel
  }: {
    rank: number
    name: string
    subtitle?: string
    value: number
    valueLabel?: string
  } = $props()

  const formattedValue = value.toLocaleString()
  const label = valueLabel ?? CURRENCY_SYMBOL
</script>

<div class="leaderboard-entry">
  <span class="rank" class:top-three={rank <= 3}>#{rank}</span>
  <div class="info">
    <span class="name">{name}</span>
    {#if subtitle}
      <span class="subtitle">{subtitle}</span>
    {/if}
  </div>
  <span class="value">{formattedValue} {label}</span>
</div>

<style lang="scss">
  .leaderboard-entry {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-grey-dark);

    &:hover {
      background: var(--color-grey-darker);
    }

    @media (max-width: 800px) {
      padding: 8px 12px;
      gap: 8px;
    }
  }

  .rank {
    font-family: var(--mono-font-stack);
    font-size: var(--font-size-small);
    color: var(--color-grey-light);
    min-width: 32px;

    &.top-three {
      color: var(--color-accent);
      font-weight: 600;
    }
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    font-size: var(--font-size-small);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    font-size: var(--font-size-tiny);
    color: var(--color-grey-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .value {
    font-family: var(--mono-font-stack);
    font-size: var(--font-size-small);
    color: var(--color-up);
    white-space: nowrap;
  }
</style>
