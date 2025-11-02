<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { DangerButton } from "$lib/components/Shared"

  let { trip, onclick }: { trip: Trip; onclick: () => void } = $props()

  // Cooldown until trip can be liquidated
  let blockUntilUnlock = $derived(
    Number(trip.creationBlock) + $gameConfig.cooldownCloseTrip - Number($blockNumber)
  )
</script>

<div class="liquidate-trip">
  <div class="action">
    <DangerButton
      text={blockUntilUnlock <= 0
        ? `Liquidate Trip`
        : `Liquidation unlocked in ${blockUntilUnlock} blocks`}
      tippyText="Liquidate trip to get the value added to your wallet"
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

  .confirmation-modal {
    width: 400px;
    height: 460px;

    .content {
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      .trip-image {
        height: 400px;
        line-height: 0;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        mix-blend-mode: multiply;
        filter: grayscale(100%);
      }
    }
  }

  .danger {
    border: none;
    background: repeating-linear-gradient(45deg, #cc0000, #cc0000 20px, #9e0000 20px, #9e0000 40px);
  }
</style>
