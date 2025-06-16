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
  import DangerButton from "@components/Main/Shared/Buttons/DangerButton.svelte"

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
  <div class="action">
    <DangerButton
      text="Liquidate Rat"
      tippyText="Kill rat to get the value added to your operator wallet"
      onclick={() => (confirming = true)}
      disabled={busy}
    />
  </div>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation danger">
    {#if busy}
      <VideoLoader duration={6000} />
    {:else}
      <div class="content">
        <img
          class="liquidate-image"
          src={$ratImageUrl}
          alt="Confirm Liquidation"
        />
        <DangerButton
          text={liquidationMessage}
          onclick={sendLiquidateRat}
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

  .action {
    width: 50%;
    height: 100%;
  }

  .liquidate-image {
    flex-basis: calc(var(--game-window-height) - 60px);
  }

  .confirmation {
    width: 400px;
    height: 460px;

    .content {
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;
      line-height: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        mix-blend-mode: screen;
        filter: grayscale(100%);
      }
    }
  }
</style>
