<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"
  import { gsap } from "gsap"

  let {
    result,
    initialBalance,
    onTimeline
  }: {
    result: EnterTripReturnValue
    initialBalance: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  // Is rat dead?
  const ratDead = $derived(result?.ratDead)

  // Elements
  let healthElement = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)
  let changeElement = $state<HTMLDivElement | null>(null)

  const calculateNewBalance = (initialBalance: number, result: EnterTripReturnValue) => {
    return (
      initialBalance +
      (result.balanceTransfers?.reduce((acc, balanceTransfer) => {
        return acc + balanceTransfer.amount
      }, 0) ?? 0)
    )
  }

  const getDisplayHealthChange = (healthChange: number) => {
    if (healthChange === 0) {
      return "0"
    } else if (healthChange > 0) {
      return HEALTH_SYMBOL + "+" + healthChange
    } else {
      return HEALTH_SYMBOL + healthChange.toString()
    }
  }

  const newBalance = calculateNewBalance(initialBalance, result)
  const healthChange = newBalance - initialBalance
  const displayHealthChange = getDisplayHealthChange(healthChange)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(changeElement, { opacity: 0 })
  }

  // No animation if the balance is the same
  const duration = newBalance === initialBalance ? 0 : 2

  const main = () => {
    // Animate the count up/down using GSAP's textContent
    timeline.to(valueElement, {
      textContent: newBalance,
      duration,
      snap: { textContent: 1 }
    })

    // After count animation, quickly fade in the health change
    timeline.to(changeElement, {
      opacity: 1,
      backgroundColor: healthChange === 0 ? "" : healthChange > 0 ? "green" : "red",
      duration: 0.2,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline, 0.6)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (healthElement && valueElement && changeElement) {
      run()
    }
  })
</script>

<!-- HEALTH -->
<div class="health" bind:this={healthElement}>
  <div class="label">
    <span>HEALTH</span>
  </div>
  <div class="value">
    <span bind:this={valueElement}>{initialBalance}</span>
  </div>
  <div class="change" bind:this={changeElement}>
    <span>{displayHealthChange}</span>
  </div>
</div>

<style lang="scss">
  .health {
    border: 1px solid white;
    border-bottom: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 80px;
    .label {
      border-right: 1px solid white;
      width: 30%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .value {
      width: 50%;
      border-right: 1px solid white;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .change {
      width: 20%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>
