<script lang="ts">
  import type { Trip as SanityTrip } from "@sanity-types"
  import { sendLiquidateTrip } from "$lib/modules/action-manager/index.svelte"
  import { BigButton, TripClosureValueBreakdown, SmallSpinner } from "$lib/components/Shared"

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
      Liquidating trip <SmallSpinner soundOn />
    </div>
  {:else}
    <div class="confirm-liquidation-text">
      <h1>
        Are you sure you want to liquidate trip #{tripContent.index}?
      </h1>
      <TripClosureValueBreakdown
        originalValue={Number(trip.balance)}
        originalLabel="Trip balance"
        payoutLabel="You will recover"
      />
    </div>
    <div class="button-container">
      <BigButton text="Abort" type="abort" onclick={onAbort} />
      <BigButton text="Confirm" type="confirm" onclick={onClickConfirm} />
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
    text-align: center;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    height: var(--game-window-main-height);

    .button-container {
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: 10px;
    }

    .loading {
      background: white;
      padding: 10px;
    }
  }
</style>
