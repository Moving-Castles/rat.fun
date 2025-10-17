<script lang="ts">
  let {
    value,
    className = "",
    hideZero = false
  }: { value: number; className?: string; hideZero?: boolean } = $props()

  let sign = $derived(value == 0 ? "" : value > 0 ? "+" : "-")
  let colorClass = $derived(value == 0 ? "" : value > 0 ? "up" : "down")
</script>

<span class="signed-number {colorClass} {className}">
  {#if (hideZero && value !== 0) || !hideZero}
    {sign}{Math.abs(value)}
  {/if}
</span>

<style lang="scss">
  .signed-number {
    text-align: right;
    &.up {
      color: var(--color-up);
    }

    &.down {
      color: var(--color-down);
    }
  }
</style>
