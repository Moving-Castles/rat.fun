<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { BigButton } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { playerTrips } from "$lib/modules/state/stores"

  let { trip, onclick }: { trip: Trip; onclick: () => void } = $props()

  // Cooldown until trip can be liquidated
  let blockUntilUnlock = $derived(
    Number(trip.creationBlock) + $gameConfig.cooldownCloseTrip - Number($blockNumber)
  )
</script>

<div class="liquidate-trip">
  <div class="action">
    <BigButton
      text={blockUntilUnlock <= 0
        ? `CASH OUT TRIP (${trip.balance}${CURRENCY_SYMBOL})`
        : `CASH OUT unlocked in ${blockUntilUnlock} blocks`}
      tippyText="Liquidate TRIP to get the value added to your wallet"
      type="danger"
      {onclick}
      disabled={busy.CloseTrip.current !== 0 || blockUntilUnlock > 0}
    />
  </div>
</div>

<style lang="scss">
  .liquidate-trip {
    height: 80px;
    display: flex;

    .action {
      width: 100%;
      height: 100%;
    }
  }
</style>
