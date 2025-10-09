<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { gsap } from "gsap"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { tippy } from "svelte-tippy"
  import { get } from "svelte/store"
  import { playSound } from "$lib/modules/sound"

  import CurrencySymbol from "$lib/components/Shared/CurrencySymbol/CurrencySymbol.svelte"

  // Element references
  let balanceElement = $state<HTMLSpanElement | null>(null)
  let containerElement = $state<HTMLDivElement | null>(null)
  let previousValue = $state<null | number>(null)
  let updates = $state(0)

  // Calculate animation duration based on value change
  function calculateDuration(value: number) {
    // let absValue = Math.abs(value)
    let duration = 1
    return duration
  }

  // Animate balance change
  function animateBalanceChange(newBalance: number, difference: number) {
    console.log("3. Animate to", newBalance, difference)
    if (!balanceElement || !containerElement) {
      console.log("Elements not ready", { balanceElement, containerElement })
      return
    }

    const isPositive = difference > 0
    const duration = calculateDuration(difference)

    console.log("duration", duration)

    // Create timeline for the animation
    const timeline = gsap.timeline()

    timeline.call(() => {
      playSound("ratfunUI", isPositive ? "countUp" : "countDown")
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
    const unsubscribe = playerERC20Balance.subscribe(updatedValue => {
      if (previousValue === null || updatedValue === previousValue || updates < 2) {
        previousValue = updatedValue

        if (balanceElement) {
          balanceElement.innerHTML = updatedValue
        }
      } else {
        animateBalanceChange(updatedValue, updatedValue - previousValue)
        previousValue = updatedValue
      }
      updates++
    })

    return () => {
      console.log("BalanceBox destroyed")
      unsubscribe()
    }
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
          <!-- {$playerERC20Balance} -->
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
