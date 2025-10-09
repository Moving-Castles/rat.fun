<script lang="ts">
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { gameConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { staticContent, lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { ModalTarget, NoImage, VideoLoader, DangerButton } from "$lib/components/Shared"
  import { busy, sendLiquidateTrip } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateTripMessage } from "$lib/modules/off-chain-sync"
  import { errorHandler } from "$lib/modules/error-handling"

  let {
    trip,
    tripId,
    onclick
  }: { trip: Trip; tripId: string; isOwnTripListing: boolean; onclick: () => void } = $props()

  let { modal } = getModalState()

  let sanityTripContent = $derived($staticContent.trips.find(r => r.title == tripId))

  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM TRIP LIQUIDATION")

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

{#snippet confirmLiquidation()}
  <div class="confirmation-modal danger">
    {#if busy.CloseTrip.current !== 0}
      <VideoLoader progress={busy.CloseTrip} />
    {:else}
      <div class="content">
        <div class="trip-image">
          {#key $lastUpdated}
            {#if sanityTripContent}
              <img src={urlFor(sanityTripContent?.image).url()} alt={`trip #${trip.index}`} />
            {:else}
              <NoImage />
            {/if}
          {/key}
        </div>
        <DangerButton
          text={liquidationMessage}
          onclick={async () => {
            try {
              liquidationMessage = "Liquidating trip..."
              await sendLiquidateTrip(tripId)
            } catch (error) {
              errorHandler(error)
              liquidationMessage = "Could not liquidate trip"
            } finally {
              sendLiquidateTripMessage(tripId)
              modal.close()
            }
          }}
          disabled={busy.CloseTrip.current !== 0}
        />
      </div>
    {/if}
  </div>
{/snippet}

{#if confirming}
  <ModalTarget
    onclose={() => {
      confirming = false
    }}
    content={confirmLiquidation}
  />
{/if}

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
