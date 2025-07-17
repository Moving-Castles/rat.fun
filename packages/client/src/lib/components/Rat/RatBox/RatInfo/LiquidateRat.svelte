<script lang="ts">
  import { ratTotalValue } from "$lib/modules/state/base/stores"
  import { tippy } from "svelte-tippy"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  import { NumberGoing, DangerButton } from "$lib/components/Shared"

  let going = $state(false)

  const onClick = async () => {
    // RAT_BOX_STATE.HAS_RAT -> RAT_BOX_STATE.CONFIRM_LIQUIDATION
    transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }
</script>

<div class="liquidate-rat">
  <div use:tippy={{ content: "Total rat value based on rat inventory" }} class="data-cell">
    <div class="inner" class:priority={going}>
      <div class="data-cell-label">Rat Value:</div>
      <div class="data-cell-value">
        $<NumberGoing bind:going muted={true} value={$ratTotalValue} />
      </div>
    </div>
  </div>
  <div class="action">
    <DangerButton
      text="Liquidate Rat"
      tippyText="Kill rat to get the value added to your wallet"
      onclick={onClick}
    />
  </div>
</div>

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
</style>
