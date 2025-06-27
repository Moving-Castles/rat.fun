<script lang="ts">
  let { type, negative, value }: { type: string; negative: boolean; value: number } = $props()
</script>

<div class="outcome {type}" class:negative>
  {#if type === "health"}
    <span class="title">Health</span>
  {:else if type === "balance"}
    <span class="title">Balance</span>
  {/if}
  <span class="value">{value}</span>
</div>

<style lang="scss">
  .outcome {
    background: var(--color-health);
    color: var(--background);
    font-size: var(--font-size-small);
    height: 30px;
    line-height: 30px;
    padding-inline: 10px;
    font-size: 12px;
    position: relative;
    display: inline-block;

    &.health {
      background: var(--color-health);
      color: var(--background);
    }

    &.balance {
      background: var(--color-value);
      color: var(--background);
    }

    &.remove,
    &.negative {
      background: var(--color-death);
    }
  }
</style>
