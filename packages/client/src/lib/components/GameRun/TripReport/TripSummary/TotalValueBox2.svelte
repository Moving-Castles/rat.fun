<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { gsap } from "gsap"
  import { TotalValueChange } from "$lib/components/Shared"

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

  const newTotalValue = ratDead ? 0 : calculateTotalRatValue(initialTotalValue, result)
  const valueChange = ratDead ? -initialTotalValue : newTotalValue - initialTotalValue
</script>

<!-- TOTAL VALUE CHANGE -->
<div class="total-value-box">
  <TotalValueChange {valueChange} {onTimeline} />
</div>

<style lang="scss">
  .total-value-box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
</style>
