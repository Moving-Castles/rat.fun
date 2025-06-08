<script lang="ts">
  import { ratTotalValue } from "@modules/state/base/stores"
  import { liquidateRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player, ratImageUrl } from "@modules/state/base/stores"
  import { tippy } from "svelte-tippy"
  import { walletNetwork } from "@modules/network"

  import NumberGoing from "@components/Main/Shared/NumberGoing/NumberGoing.svelte"
  import VideoLoader from "@components/Main/Shared/VideoLoader/VideoLoader.svelte"

  import {
    ModalTarget,
    getModalState,
  } from "@components/Main/Modal/state.svelte"
  import { sendLiquidateRatMessage } from "@modules/off-chain-sync"

  let { modal } = getModalState()

  let busy = $state(false)
  let going = $state(false)
  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM RAT LIQUIDATION")

  const sendLiquidateRat = async () => {
    if (busy) return
    busy = true
    playSound("tcm", "ratScream")
    const action = liquidateRat()

    try {
      liquidationMessage = "Eliminating rat..."
      await waitForCompletion(action)
    } catch (e) {
      busy = false
      console.error(e)
    } finally {
      sendLiquidateRatMessage($walletNetwork, $player.ownedRat)
      modal.close()
    }
  }

  // Withhold changes to this value until the
  // ratTotalValue
</script>

<div class="liquidate-rat">
  <div
    use:tippy={{ content: "Total rat value based on rat inventory" }}
    class="data-cell"
  >
    <div class="inner" class:priority={going}>
      <div class="data-cell-label">Rat Value:</div>
      <div class="data-cell-value">
        $<NumberGoing bind:going muted={true} value={$ratTotalValue} />
      </div>
      <!-- <div class="data-cell-value">${$ratTotalValue}</div> -->
    </div>
  </div>
  <button
    use:tippy={{
      content: "Kill rat to get the value added to your operator wallet",
    }}
    disabled={busy}
    onclick={() => (confirming = true)}
    class="action warning-mute"
  >
    Liquidate Rat
  </button>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation danger">
    <div class="content">
      {#if busy}
        <VideoLoader duration={6000} />
      {:else}
        <img
          class="liquidate-image"
          src={$ratImageUrl}
          alt="Confirm Liquidation"
        />
        <button disabled={busy} onclick={sendLiquidateRat} class="modal-button">
          {liquidationMessage}
        </button>
      {/if}
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
  .liquidate-rat {
    height: 100%;
    display: flex;
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
    color: var(--background);

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

  .liquidate-image {
    height: 100%;
    max-height: 440px;
  }

  .confirmation {
    .content {
      height: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;
      line-height: 0;
      height: 540px;

      img,
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        mix-blend-mode: screen;
        filter: grayscale(100%);
      }
    }

    button {
      height: 60px;
      border: var(--default-border-style);
      color: var(--background);
      background: var(--color-death);

      &:hover {
        background: var(--background);
        color: var(--foreground);
      }
    }
  }

  button[disabled] {
    background: var(--color-grey-mid);
  }
</style>
