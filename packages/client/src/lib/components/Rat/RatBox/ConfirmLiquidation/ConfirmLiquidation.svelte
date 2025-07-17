<script lang="ts">
  import { rat } from "$lib/modules/state/base/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  const onClickConfirm = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.LIQUIDATING_RAT
    transitionTo(RAT_BOX_STATE.LIQUIDATING_RAT)
  }

  const onClickAbort = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.HAS_RAT
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-liquidation">
  <div class="confirm-liquidation-text">
    <h1>Are you sure you want to liquidate {$rat?.name}?</h1>
  </div>
  <div class="button-container">
    <BigButton text="Confirm" onclick={onClickConfirm} />
    <BigButton text="Abort" onclick={onClickAbort} />
  </div>
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
