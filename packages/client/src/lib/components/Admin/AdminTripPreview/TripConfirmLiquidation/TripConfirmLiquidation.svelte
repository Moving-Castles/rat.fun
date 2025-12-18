<script lang="ts">
  import type { Trip as SanityTrip } from "@sanity-types"
  import { sendLiquidateTrip } from "$lib/modules/action-manager/index.svelte"
  import {
    BigButton,
    TripClosureValueBreakdown,
    SmallSpinner,
    TotalValue
  } from "$lib/components/Shared"

  let {
    tripId,
    trip,
    tripContent,
    onDone,
    onAbort
  }: {
    tripId: string
    trip: Trip
    tripContent: SanityTrip
    onDone: () => void
    onAbort: () => void
  } = $props()

  let liquidating = $state(false)

  const onClickConfirm = async () => {
    liquidating = true
    await sendLiquidateTrip(tripId)
    onDone()
  }
</script>

<div class="confirm-liquidation">
  {#if liquidating}
    <div class="loading">
      Cashing out TRIP <SmallSpinner soundOn />
    </div>
  {:else}
    <div class="confirm-liquidation-content">
      <div class="total-value-container">
        <TotalValue value={Number(trip.balance)} />
      </div>
      <div class="confirm-liquidation-text">
        <TripClosureValueBreakdown
          originalValue={Number(trip.balance)}
          originalLabel="TRIP balance"
          payoutLabel="You will recover"
        />
      </div>
      <div class="fine-print">
        Are you sure you want to CASH OUT? Trip no. {tripContent.index} will be erased from the SLOP
        MACHINE database
      </div>
      <div class="button-container">
        <div class="abort-button-container">
          <BigButton text="Abort" type="abort" onclick={onAbort} />
        </div>
        <div class="confirm-button-container">
          <BigButton text="Confirm" type="confirm" onclick={onClickConfirm} />
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .confirm-liquidation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    background-image: url("/images/texture-2.png");
    background-size: 200px;

    .confirm-liquidation-content {
      width: calc(100% - 40px);

      .confirm-liquidation-text {
        width: 100%;
        padding-bottom: 10px;
        color: var(--background);
      }

      .fine-print {
        width: 100%;
        padding-bottom: 10px;
        padding-top: 10px;
        color: var(--background);
        margin-top: 20px;
        margin-bottom: 20px;
        background: var(--color-grey-light);
      }

      .button-container {
        overflow: hidden;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: 10px;
        height: 80px;
        @media (max-width: 800px) {
          width: 100%;
          flex-direction: column;
          height: auto;
        }

        .abort-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 3;
          }
        }

        .confirm-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 1;
          }
        }
      }
    }

    .loading {
      background: var(--foreground);
      color: black;
      padding: 10px;
    }
  }
</style>
