<script lang="ts">
  import { onMount } from "svelte"
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { gsap } from "gsap"

  let {
    value
  }: {
    value?: number
  } = $props()

  // Use ratTotalValue store if no value prop provided (backward compatible)
  const targetValue = $derived(value ?? Number($ratTotalValue))

  let displayValue = $state(0)
  let animatedObj = { value: 0 }

  // Pad with leading zeros for integer display
  function formatValue(num: number): string {
    return String(Math.floor(num)).padStart(String(Math.floor(targetValue)).length, "0")
  }

  // Animate on mount
  onMount(() => {
    gsap.to(animatedObj, {
      value: targetValue,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        displayValue = animatedObj.value
      }
    })
  })
</script>

<div class="total-value">
  <span class="value">{formatValue(displayValue)}</span>
  <span class="currency-symbol">{CURRENCY_SYMBOL}</span>
</div>

<style lang="scss">
  .total-value {
    font-size: 10dvw;
    font-family: var(--special-font-stack);
    color: var(--background);
    background: var(--color-total-value);
    border-radius: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (min-width: 1800px) {
      font-size: var(--font-size-ultra);
    }

    .value {
      margin-right: 5px;
    }

    .currency-symbol {
      opacity: 0.5;
    }
  }
</style>
