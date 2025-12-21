<script lang="ts">
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"

  let {
    value,
    class: className = ""
  }: {
    value: number
    class?: string
  } = $props()

  const negative = value < 0
  const displayValue = value > 0 ? `+${value}` : `${value}`
</script>

<div class="outcome {className}" class:negative>
  <span class="heart">{HEALTH_SYMBOL}</span>
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
    background: var(--color-good);
    color: var(--background);

    &.negative {
      background: var(--color-bad);
    }
  }

  .heart {
    display: inline-block;
    margin-right: 5px;
  }
</style>
