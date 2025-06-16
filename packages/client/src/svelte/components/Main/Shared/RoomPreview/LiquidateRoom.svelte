<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import { closeRoom } from "@modules/action"
  import { playSound } from "@modules/sound"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import {
    ModalTarget,
    getModalState,
  } from "@components/Main/Modal/state.svelte"
  import { gameConfig } from "@modules/state/base/stores"
  import { blockNumber } from "@modules/network"
  import { staticContent, lastUpdated } from "@modules/content"
  import { urlFor } from "@modules/content/sanity"
  import { sendLiquidateRoomMessage } from "@modules/off-chain-sync"
  import { walletNetwork } from "@modules/network"

  import NoImage from "@components/Main/Shared/NoImage/NoImage.svelte"
  import VideoLoader from "@components/Main/Shared/VideoLoader/VideoLoader.svelte"
  import DangerButton from "@components/Main/Shared/Buttons/DangerButton.svelte"

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r.title == roomId)
  )

  let {
    room,
    roomId,
    isOwnRoomListing,
  }: { room: Room; roomId: string; isOwnRoomListing: boolean } = $props()

  let { rooms } = getUIState()

  let { modal } = getModalState()

  let busy = $state(false)
  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM ROOM LIQUIDATION")

  // Cooldown until room can be liquidated
  let blockUntilUnlock = $derived(
    Number(room.creationBlock) +
      $gameConfig.gameConfig.cooldownCloseRoom -
      Number($blockNumber)
  )

  async function sendLiquidateRoom() {
    if (busy) return
    playSound("tcm", "blink")
    busy = true
    const action = closeRoom(roomId)
    try {
      liquidationMessage = "Liquidating room..."
      await waitForCompletion(action)
      liquidationMessage = "Liquidation complete"
    } catch (e) {
      console.error(e)
      liquidationMessage = "Could not liquidate room"
    } finally {
      sendLiquidateRoomMessage($walletNetwork, roomId)
      rooms.back(isOwnRoomListing)
      modal.close()
    }
  }
</script>

<div class="liquidate-room">
  <div class="action">
    <DangerButton
      text={blockUntilUnlock <= 0
        ? `Liquidate Room (Get ${room.balance})`
        : `Liquidation unlocked in ${blockUntilUnlock} blocks`}
      tippyText="Liquidate room to get the value added to your operator wallet"
      onclick={() => (confirming = true)}
      disabled={busy || blockUntilUnlock > 0}
    />
  </div>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation-modal danger">
    {#if busy}
      <VideoLoader duration={6000} />
    {:else}
      <div class="content">
        <div class="room-image">
          {#key $lastUpdated}
            {#if sanityRoomContent}
              <img
                src={urlFor(sanityRoomContent?.image).url()}
                alt={`room #${room.index}`}
              />
            {:else}
              <NoImage />
            {/if}
          {/key}
        </div>
        <DangerButton
          text={liquidationMessage}
          onclick={sendLiquidateRoom}
          disabled={busy}
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
  .liquidate-room {
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
      .room-image {
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
    background: repeating-linear-gradient(
      45deg,
      #cc0000,
      #cc0000 20px,
      #9e0000 20px,
      #9e0000 40px
    );
  }
</style>
