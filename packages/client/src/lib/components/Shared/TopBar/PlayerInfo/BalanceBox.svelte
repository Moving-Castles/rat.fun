<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import {
    playerERC20Balance,
    previousPlayerERC20Balance,
    isFirstBalanceLoad
  } from "$lib/modules/erc20Listener/stores"
  import { tippy } from "svelte-tippy"
  import { get } from "svelte/store"

  import CurrencySymbol from "$lib/components/Shared/CurrencySymbol/CurrencySymbol.svelte"

  // Element references
  let balanceElement = $state<HTMLSpanElement | null>(null)
  let containerElement = $state<HTMLDivElement | null>(null)

  // Calculate animation duration based on value change
  function calculateDuration(value: number) {
    // let absValue = Math.abs(value)
    let duration = 2
    return duration
  }

  // Animate balance change
  function animateBalanceChange(newBalance: number, difference: number) {
    if (!balanceElement || !containerElement) {
      return
    }

    const isPositive = difference > 0
    const duration = calculateDuration(difference)

    // Create timeline for the animation
    const timeline = gsap.timeline()

    // Add visual feedback for positive/negative changes
    timeline.to(containerElement, {
      backgroundColor: isPositive ? "green" : "red",
      duration: 0
    })

    // Animate the count up/down
    timeline.to(
      balanceElement,
      {
        textContent: newBalance,
        duration: duration,
        snap: { textContent: 1 },
        ease: "power2.out"
      },
      "<"
    )

    // Reset background color after animation
    timeline.to(
      containerElement,
      {
        backgroundColor: "var(--color-value)",
        duration: 0.3,
        ease: "power2.out"
      },
      ">+0.2"
    )
  }

  onMount(() => {
    // Listen to changes to the balance
    playerERC20Balance.subscribe(newBalance => {
      const previousBalance = get(previousPlayerERC20Balance)
      const firstBalanceLoad = get(isFirstBalanceLoad)
      console.log("0. firstBalanceLoad", firstBalanceLoad)
      console.log("1. newBalance", newBalance)
      console.log("2. previousBalance", previousBalance)
      // Only animate if the balance has changed
      if (previousBalance !== newBalance) {
        // Skip animation on first load
        if (firstBalanceLoad) {
          // Set directly without animation
          if (balanceElement) {
            balanceElement.textContent = newBalance.toString()
          }
          isFirstBalanceLoad.set(false)
        } else {
          // Animate subsequent changes
          animateBalanceChange(newBalance, newBalance - previousBalance)
        }
        previousPlayerERC20Balance.set(newBalance)
      }
    })
  })
</script>

<!-- BALANCE -->
<div
  use:tippy={{
    content: `This is available tokens in your wallet`,
    placement: "bottom"
  }}
  class="stat-item balance"
  bind:this={containerElement}
>
  <div class="inner-wrapper">
    <div class="value">
      <span>
        <CurrencySymbol />
        <span bind:this={balanceElement}>
          {$previousPlayerERC20Balance}
        </span>
      </span>
    </div>
  </div>
</div>

<style lang="scss">
  .stat-item {
    display: flex;
    height: 100%;
    line-height: var(--top-bar-height);
    border: 0;
    background: transparent;
    border-right: var(--default-border-style);
    color: var(--foreground);

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
    }
  }
</style>
