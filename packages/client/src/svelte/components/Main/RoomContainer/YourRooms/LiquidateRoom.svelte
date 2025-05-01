<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import { closeRoom } from "@modules/action"
  import { playSound } from "@modules/sound"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { tippy } from "svelte-tippy"
  import {
    ModalTarget,
    getModalState,
  } from "@components/Main/Modal/state.svelte"
  import { staticContent, lastUpdated, urlFor } from "@modules/content"

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r.title == roomId)
  )

  let { room, roomId, isOwnRoomListing } = $props()

  let { rooms } = getUIState()

  let { modal } = getModalState()

  let busy = $state(false)
  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM LIQUIDATION")

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
      busy = false
      setTimeout(() => {
        modal.close()
      }, 1200)
      rooms.back(isOwnRoomListing)
    }
  }
</script>

<div class="liquidate-room">
  <div use:tippy={{ content: "Total room value" }} class="data-cell">
    <div class="inner">
      <div class="data-cell-label">Room balance:</div>
      <div class="data-cell-value">${room.balance}</div>
    </div>
  </div>
  <button
    use:tippy={{
      content: "Liquidate room to get the value added to your operator wallet",
    }}
    disabled={busy}
    onclick={() => (confirming = true)}
    class="action warning-mute"
  >
    Liquidate Room
  </button>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation danger">
    <div class="content">
      <div class="room-image">
        {#key $lastUpdated}
          {#if sanityRoomContent}
            <img src={urlFor(sanityRoomContent?.image).url()} alt={room.name} />
          {:else}
            <img src="/images/room3.jpg" alt={room.name} />
          {/if}
        {/key}
      </div>
      <button disabled={busy} onclick={sendLiquidateRoom} class="modal-button">
        {liquidationMessage}
      </button>
    </div>
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
    height: var(--liquidate-rat-height);
    display: flex;
    border: var(--default-border-style);
  }

  .data-cell {
    width: 50%;
    border-right: var(--default-border-style);
    height: 100%;
    padding: var(--default-padding);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-value);
    color: black;

    .inner {
      display: flex;

      .data-cell-label {
        margin-right: 1ch;
      }
    }
  }

  .modal-button {
    width: 100%;
    height: 100%;
  }

  button {
    &:hover {
      background: repeating-linear-gradient(
        45deg,
        #cc0000,
        #cc0000 20px,
        #9e0000 20px,
        #9e0000 40px
      );
    }
  }

  .action {
    width: 50%;
    height: 100%;
    padding: var(--default-padding);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .warning {
    border: none;
    background: repeating-linear-gradient(
      45deg,
      #f0d000,
      #f0d000 20px,
      #bda400 20px,
      #bda400 40px
    );
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

  .warning-mute {
    color: white;
    border: none;
    background: repeating-linear-gradient(
      45deg,
      black,
      black 20px,
      #222 20px,
      #222 40px
    );
  }

  .liquidate-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    mix-blend-mode: difference;
  }

  .confirmation {
    .content {
      height: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        mix-blend-mode: difference;
      }
    }

    button {
      height: 60px;
      border: var(--default-border-style);
      color: white;
      background: black;
    }
  }

  button[disabled] {
    background: var(--color-grey-mid);
  }
</style>
