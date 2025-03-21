<script lang="ts">
  import { ratTotalValue } from "@modules/state/base/stores"
  import { liquidateRat } from "@svelte/modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"

  let busy = $state(false)

  const sendLiquidateRat = async () => {
    if (busy) return
    busy = true
    const action = liquidateRat()
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }
</script>

<div class="liquidate-rat">
  <div class="data-cell">
    <div class="inner">
      <div class="data-cell-label">Rat Value:</div>
      <div class="data-cell-value">${$ratTotalValue}</div>
    </div>
  </div>
  <button disabled={busy} onclick={sendLiquidateRat} class="action warning">
    Liquidate Rat
  </button>
</div>

<style lang="scss">
  .liquidate-rat {
    height: var(--liquidate-rat-height);
    display: flex;
  }

  .data-cell {
    width: 50%;
    border-right: 1px solid white;
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

  .action {
    width: 50%;
    height: 100%;
    padding: var(--default-padding);
    display: flex;
    justify-content: center;
    align-items: center;

    &.warning {
      background: repeating-linear-gradient(
        45deg,
        #f0d000,
        #f0d000 20px,
        #bda400 20px,
        #bda400 40px
      );
    }
  }

  button[disabled] {
    background: grey;
  }
</style>
