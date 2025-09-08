<script lang="ts">
  import { BigButton, ValueBreakdown, VideoLoaderDuration } from "$lib/components/Shared"
  import type { Room as SanityRoom } from "@sanity-types"
  import { sendLiquidateRoom } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateRoomMessage } from "$lib/modules/off-chain-sync"

  let {
    room,
    roomContent,
    onDone,
    onAbort
  }: { room: Room; roomContent: SanityRoom; onDone: () => void; onAbort: () => void } = $props()

  let liquidating = $state(false)

  const onClickConfirm = async () => {
    liquidating = true
    await sendLiquidateRoom(roomContent._id)
    sendLiquidateRoomMessage(roomContent._id)
    onDone()
  }
</script>

<div class="confirm-liquidation">
  {#if liquidating}
    <VideoLoaderDuration duration={4000} />
  {:else}
    <div class="confirm-liquidation-text">
      <h1>
        Are you sure you want to liquidate trip #{roomContent.index}?
      </h1>
      <ValueBreakdown
        originalValue={Number(room.balance)}
        originalLabel="Room balance"
        taxRateKey="taxationCloseRoom"
        payoutLabel="You will recover"
      />
    </div>
    <div class="button-container">
      <BigButton text="Confirm" onclick={onClickConfirm} />
      <BigButton text="Abort" onclick={onAbort} />
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
    height: calc(var(--game-window-height) - 120px);

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
  }
</style>
