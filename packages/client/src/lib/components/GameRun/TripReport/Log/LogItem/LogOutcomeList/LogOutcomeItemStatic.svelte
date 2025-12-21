<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let {
    name,
    value,
    action,
    class: className = ""
  }: {
    name: string
    value: number
    action: "add" | "remove"
    class?: string
  } = $props()

  const negative = action === "remove"
  const displayValue = `${name} (${negative ? "-" : ""}${value} ${CURRENCY_SYMBOL})`
</script>

<div class="outcome {className}" class:negative>
  <span class="value">{displayValue}</span>
</div>

<style lang="scss">
  .outcome {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 10px;
    font-size: var(--font-size-normal);
    white-space: nowrap;
    background: var(--color-good);
    color: var(--background);

    &.negative {
      background: var(--color-bad);
    }
  }
</style>
