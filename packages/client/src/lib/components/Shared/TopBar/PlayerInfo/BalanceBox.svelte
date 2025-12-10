<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { gsap } from "gsap"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  // Element references
  let balanceElement = $state<HTMLSpanElement | null>(null)
  let containerElement = $state<HTMLDivElement | null>(null)
  let previousValue = $state<null | number>(null)
  let updates = $state(0)
  let unsubscribe = $state<() => void | null>()

  // Animate balance change
  function animateBalanceChange(newBalance: number, difference: number) {
    if (!balanceElement || !containerElement) {
      return
    }

    const isPositive = difference > 0
    const duration = 0.7 // Always 0.7 seconds

    // Create timeline for the animation
    const timeline = gsap.timeline()

    timeline.call(() => {
      playSound({ category: "ratfunUI", id: isPositive ? "tokenPositive" : "tokenNegative" })
    })

    // Add visual feedback for positive/negative changes
    timeline.to(containerElement, {
      backgroundColor: isPositive ? "green" : "red",
      duration: 0
    })

    // Animate the count up/down - use element reference instead of selector
    timeline.to(
      balanceElement,
      {
        textContent: newBalance,
        duration: duration,
        snap: { textContent: 1 },
        ease: "power4.out"
      },
      "<"
    )

    // Reset background color after animation
    timeline.to(
      containerElement,
      {
        backgroundColor: "var(--color-grey-lighter)",
        duration: 0.3,
        ease: "power4.out"
      },
      ">+0.2"
    )
  }

  onMount(() => {
    unsubscribe = playerERC20Balance.subscribe(updatedValue => {
      if (previousValue === null || updatedValue === previousValue || updates < 2) {
        previousValue = updatedValue

        if (balanceElement) {
          balanceElement.innerHTML = String(updatedValue)
        }
      } else {
        animateBalanceChange(updatedValue, updatedValue - previousValue)
        previousValue = updatedValue
      }
      updates++
    })
  })

  onDestroy(() => {
    unsubscribe?.()
  })
</script>

<!-- BALANCE -->
<div class="balance-box" bind:this={containerElement}>
  <Tooltip content={UI_STRINGS.tokensAvailable}>
    <div class="label">
      {UI_STRINGS.tokensAvailableLabel}
    </div>
    <div class="content">
      <span class="value" bind:this={balanceElement}></span>
      <span class="currency-symbol">{CURRENCY_SYMBOL}</span>
    </div>
  </Tooltip>
</div>

<style lang="scss">
  .balance-box {
    height: 100%;
    border-right: var(--default-border-style);
    padding: 0;
    min-width: 100px;
    background: var(--color-grey-lighter);
    color: var(--black);

    :global(> *) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: var(--font-size-small);
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 2px;
      padding-bottom: 2px;
      width: 100%;
      color: var(--color-grey-dark);
      border-bottom: 1px solid var(--color-border);
    }

    .content {
      flex: 1;
      font-size: var(--font-size-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;

      .currency-symbol {
        margin-left: 4px;
      }
    }
  }
</style>
