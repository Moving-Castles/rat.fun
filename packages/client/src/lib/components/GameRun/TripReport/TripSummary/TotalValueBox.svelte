<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { gsap } from "gsap"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  import { Tooltip } from "$lib/components/Shared"

  let {
    result,
    initialTotalValue,
    onTimeline
  }: {
    result: EnterTripReturnValue
    initialTotalValue: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  // Is rat dead?
  const ratDead = result?.ratDead

  // Elements
  let totalValueElement = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)
  let changeElement = $state<HTMLDivElement | null>(null)

  const calculateTotalRatValue = (
    initialTotalValue: number | undefined,
    result: EnterTripReturnValue
  ) => {
    if (!initialTotalValue || !result) {
      return 0
    }

    const itemChangesValue =
      result.itemChanges?.reduce((acc, item) => {
        if (item.type === "add") {
          return acc + item.value
        }
        return acc - item.value
      }, 0) ?? 0

    const balanceTransfersValue =
      result.balanceTransfers?.reduce((acc, balanceTransfer) => {
        return acc + balanceTransfer.amount
      }, 0) ?? 0

    return initialTotalValue + itemChangesValue + balanceTransfersValue
  }

  const getDisplayValueChange = (valueChange: number) => {
    if (valueChange === 0) {
      return CURRENCY_SYMBOL + "0"
    } else if (valueChange > 0) {
      return CURRENCY_SYMBOL + "+" + valueChange
    } else {
      return CURRENCY_SYMBOL + valueChange
    }
  }

  const newTotalValue = ratDead ? 0 : calculateTotalRatValue(initialTotalValue, result)
  const valueChange = ratDead ? -initialTotalValue : newTotalValue - initialTotalValue
  const displayValueChange = getDisplayValueChange(valueChange)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(changeElement, { opacity: 0 })
  }

  // No animation if the total value is the same
  const duration = newTotalValue === initialTotalValue ? 0 : 2

  const main = () => {
    // Animate the count up/down using GSAP's textContent
    timeline.to(valueElement, {
      textContent: newTotalValue,
      duration,
      snap: { textContent: 1 }
    })

    // After count animation, quickly fade in the value change
    timeline.to(changeElement, {
      opacity: 1,
      backgroundColor: valueChange === 0 ? "" : valueChange > 0 ? "green" : "red",
      duration: 0.2,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline, 0.8)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (totalValueElement && valueElement && changeElement) {
      run()
    }
  })
</script>

<!-- TOTAL VALUE -->
<div class="total-value" bind:this={totalValueElement}>
  <div class="label">
    <span>VALUE</span>
  </div>
  <div class="value">
    <span>{CURRENCY_SYMBOL}<span bind:this={valueElement}>{initialTotalValue}</span></span>
  </div>
  <div class="change" bind:this={changeElement}>
    <Tooltip content={displayValueChange}>
      <span>{displayValueChange}</span>
    </Tooltip>
  </div>
</div>

<style lang="scss">
  .total-value {
    border: 1px solid white;
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
      font-size: var(--font-size-extra-large);
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
