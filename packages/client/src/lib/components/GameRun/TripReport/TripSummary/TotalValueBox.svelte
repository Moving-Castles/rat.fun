<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { gsap } from "gsap"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let totalValueElement = $state<HTMLDivElement | null>(null)

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

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(totalValueElement, { opacity: 0 })
  }

  const main = () => {
    timeline.to(totalValueElement, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (totalValueElement) {
      run()
    }
  })
</script>

<!-- TOTAL VALUE -->
<div class="total-value" bind:this={totalValueElement}>
  OLD TOTAL VALUE:{$frozenRat?.initialTotalValue}
  NEW TOTAL VALUE: {calculateTotalRatValue($frozenRat?.initialTotalValue, result)}
</div>

<style lang="scss">
  .total-value {
    background: green;
    padding: 20px;
  }
</style>
