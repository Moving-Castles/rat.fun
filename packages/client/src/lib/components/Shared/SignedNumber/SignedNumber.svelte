<script lang="ts">
  let { value, className = "" }: { value: number; className?: string } = $props()

  let sign = $derived(value == 0 ? "" : value > 0 ? "+" : "-")
  let colorClass = $derived(value == 0 ? "" : value > 0 ? "up" : "down")
</script>

<span class="signed-number {colorClass} {className}">
  {sign}{Math.abs(value)}
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
