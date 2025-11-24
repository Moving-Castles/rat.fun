<script lang="ts">
  import { onMount } from "svelte"
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { gsap } from "gsap"

  let displayValue = $state(0)
  let animatedObj = { value: 0 }

  // Helper function to pad number with leading zeros
  function padNumber(num: number, targetLength: number): string {
    return String(Math.floor(num)).padStart(targetLength, "0")
  }

  // Animate on mount
  onMount(() => {
    const targetValue = Number($ratTotalValue)

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
  <span class="value">{padNumber(displayValue, String(Number($ratTotalValue)).length)}</span>
  <span class="currency-symbol">{CURRENCY_SYMBOL}</span>
</div>

<style lang="scss">
  .total-value {
    font-size: 10dvw;
    font-family: var(--special-font-stack);
    color: var(--background);
    background: gold;
    border-radius: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;

    .value {
      font-size: 10dvw;
      margin-right: 5px;
    }

    .currency-symbol {
      opacity: 0.5;
    }
  }
</style>
