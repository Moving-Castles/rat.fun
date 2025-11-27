<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { Tween } from "svelte/motion"
  let {
    value,
    className = "",
    withCurrency = false,
    withTween = false,
    hideZero = false,
    neutralColor = "white"
  }: {
    value: number
    className?: string
    withCurrency?: boolean
    hideZero?: boolean
    withTween?: boolean
    neutralColor?: string
  } = $props()

  let sign = $derived(value == 0 ? "" : value > 0 ? "+" : "-")
  let colorClass = $derived(value == 0 ? "neutral" : value > 0 ? "up" : "down")
  let tweenedValue = new Tween(value, { duration: withTween ? 1000 : 0 })

  $effect(() => {
    tweenedValue.set(value)
  })
</script>

<span style:--color-neutral={neutralColor} class="signed-number {colorClass} {className}">
  {#if (hideZero && value !== 0) || !hideZero}
    {sign}{Math.floor(Math.abs(tweenedValue.current))}{#if withCurrency}
      {CURRENCY_SYMBOL}{/if}
  {/if}
</span>

<style lang="scss">
  .signed-number {
    text-align: right;
    &.neutral {
      color: var(--color-neutral);
    }
    &.up {
      color: var(--color-up);
    }

    &.down {
      color: var(--color-down);
    }
  }
</style>
