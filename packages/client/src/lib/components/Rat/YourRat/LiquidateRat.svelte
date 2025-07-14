<script lang="ts">
  import { ratTotalValue } from "$lib/modules/state/base/stores"
  import { player, ratImageUrl } from "$lib/modules/state/base/stores"
  import { tippy } from "svelte-tippy"
  import { busy, sendLiquidateRat } from "$lib/modules/action-manager/index.svelte"

  import { NumberGoing, VideoLoader, DangerButton, ModalTarget } from "$lib/components/Shared"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { sendLiquidateRatMessage } from "$lib/modules/off-chain-sync"

  let { modal } = getModalState()

  let going = $state(false)
  let confirming = $state(false)
  let liquidationMessage = $state("CONFIRM RAT LIQUIDATION")
</script>

<div class="liquidate-rat">
  <div use:tippy={{ content: "Total rat value based on rat inventory" }} class="data-cell">
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
      tippyText="Kill rat to get the value added to your wallet"
      onclick={() => {
        confirming = true
      }}
      disabled={busy.LiquidateRat.current !== 0}
    />
  </div>
</div>

{#snippet confirmLiquidation()}
  <div class="confirmation danger">
    {#if busy.LiquidateRat.current !== 0}
      <VideoLoader progress={busy.LiquidateRat} />
    {:else}
      <div class="content">
        <img class="liquidate-image" src={$ratImageUrl} alt="Confirm Liquidation" />
        <DangerButton
          text={liquidationMessage}
          onclick={async () => {
            liquidationMessage = "Eliminating rat..."
            try {
              await sendLiquidateRat()
              sendLiquidateRatMessage($player.ownedRat)
            } catch (er) {
              console.error(er)
            } finally {
              modal.close()
            }
          }}
          disabled={busy.LiquidateRat.current !== 0}
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
    noclose={false}
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
