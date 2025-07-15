<script lang="ts">
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { gameConfig } from "$lib/modules/state/base/stores"
  import { blockNumber } from "$lib/modules/network"
  import { staticContent, lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { ModalTarget, NoImage, VideoLoader, DangerButton } from "$lib/components/Shared"
  import { busy, sendLiquidateRoom } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateRoomMessage } from "$lib/modules/off-chain-sync"

  let sanityRoomContent = $derived($staticContent.rooms.find(r => r.title == roomId))
  let { room, roomId }: { room: Room; roomId: string; isOwnRoomListing: boolean } = $props()
  let { modal } = getModalState()

  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM ROOM LIQUIDATION")

  // Cooldown until room can be liquidated
  let blockUntilUnlock = $derived(
    Number(room.creationBlock) + $gameConfig.gameConfig.cooldownCloseRoom - Number($blockNumber)
  )
</script>

<div class="liquidate-room">
  <div class="action">
    <DangerButton
      text={blockUntilUnlock <= 0
        ? `Liquidate Room (Get ${room.balance})`
        : `Liquidation unlocked in ${blockUntilUnlock} blocks`}
      tippyText="Liquidate room to get the value added to your wallet"
      onclick={async () => {
        await sendLiquidateRoom(roomId)
        sendLiquidateRoomMessage(roomId)
      }}
      disabled={busy.CloseRoom.current !== 0 || blockUntilUnlock > 0}
    />
  </div>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation-modal danger">
    {#if busy.CloseRoom.current !== 0}
      <VideoLoader progress={busy.CloseRoom} />
    {:else}
      <div class="content">
        <div class="room-image">
          {#key $lastUpdated}
            {#if sanityRoomContent}
              <img src={urlFor(sanityRoomContent?.image).url()} alt={`room #${room.index}`} />
            {:else}
              <NoImage />
            {/if}
          {/key}
        </div>
        <DangerButton
          text={liquidationMessage}
          onclick={async () => {
            try {
              liquidationMessage = "Liquidating room..."
              await sendLiquidateRoom(roomId)
            } catch (error) {
              liquidationMessage = "Could not liquidate room"
              console.error(error)
            } finally {
              sendLiquidateRoomMessage(roomId)
              modal.close()
            }
          }}
          disabled={busy.CloseRoom.current !== 0}
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
    background: repeating-linear-gradient(45deg, #cc0000, #cc0000 20px, #9e0000 20px, #9e0000 40px);
  }
</style>
