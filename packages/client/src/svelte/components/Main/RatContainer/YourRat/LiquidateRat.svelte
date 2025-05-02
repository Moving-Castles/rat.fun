<script lang="ts">
  import { ratTotalValue } from "@modules/state/base/stores"
  import { liquidateRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { tippy } from "svelte-tippy"
  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"
  import {
    ModalTarget,
    getModalState,
  } from "@components/Main/Modal/state.svelte"

  let { modal } = getModalState()

  let busy = $state(false)
  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM LIQUIDATION")

  const sendLiquidateRat = async () => {
    if (busy) return
    busy = true
    const action = liquidateRat()
    try {
      liquidationMessage = "Eliminating rat..."
      await waitForCompletion(action)
      playSound("tcm", "TRX_no")
    } catch (e) {
      busy = false
      console.error(e)
    } finally {
      liquidationMessage = "Elimination complete"

      setTimeout(() => {
        modal.close()
      }, 1200)
    }
  }
</script>

<div class="liquidate-rat">
  <div
    use:tippy={{ content: "Total rat value based on rat inventory" }}
    class="data-cell"
  >
    <div class="inner">
      <div class="data-cell-label">Rat Value:</div>
      <div class="data-cell-value">${$ratTotalValue}</div>
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
    {#if busy}
      <Spinner />
    {:else}
      Liquidate Rat
    {/if}
  </button>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation danger">
    <div class="content">
      <img
        class="liquidate-image"
        src="/images/liquidate.jpg"
        alt="Confirm Liquidation"
      />
      <button disabled={busy} onclick={sendLiquidateRat} class="modal-button">
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

      img {
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
      color: var(--foreground);
      background: var(--background);
    }
  }

  button[disabled] {
    background: var(--color-grey-mid);
  }
</style>
