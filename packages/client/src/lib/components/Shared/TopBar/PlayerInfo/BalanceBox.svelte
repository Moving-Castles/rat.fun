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
        backgroundColor: "var(--color-value)",
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
<div class="stat-item balance" bind:this={containerElement}>
  <div class="inner-wrapper">
    <Tooltip content={UI_STRINGS.tokensAvailable}>
      <div class="balance-value">
        <span class="value" bind:this={balanceElement}></span>
        <span class="currency-symbol">{CURRENCY_SYMBOL}</span>
      </div>
    </Tooltip>
  </div>
</div>

<style lang="scss">
  .stat-item {
    display: flex;
    height: 100%;
    line-height: var(--top-bar-height);
    background: transparent;
    border-right: var(--default-border-style);
    color: var(--foreground);
    padding: 0;
    background: red;
    min-width: 100px;

    &.balance {
      background: var(--color-value);
      color: var(--black);
      font-size: var(--font-size-normal);
    }

    .inner-wrapper {
      display: inline-flex;
      padding-inline: 10px;
      align-items: center;
      width: 100%;

      .balance-value {
        display: flex;

        .value {
          margin-right: 5px;
        }
      }
    }
  }
</style>
