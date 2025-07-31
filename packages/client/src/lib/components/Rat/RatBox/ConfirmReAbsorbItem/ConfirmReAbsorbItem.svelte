<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  const onClickConfirm = () => {
    // RAT_BOX_STATE.CONFIRM_RE_ABSORB_ITEM -> RAT_BOX_STATE.RE_ABSORBING_ITEM
    transitionTo(RAT_BOX_STATE.RE_ABSORBING_ITEM)
  }

  const onClickAbort = () => {
    // RAT_BOX_STATE.CONFIRM_RE_ABSORB_ITEM -> RAT_BOX_STATE.HAS_RAT
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-re-absorb-item">
  <div class="confirm-re-absorb-item-text">
    <h1>xxxxx?</h1>
  </div>
  <div class="button-container">
    <BigButton text="Confirm" onclick={onClickConfirm} />
    <BigButton text="Abort" onclick={onClickAbort} />
  </div>
</div>

<style lang="scss">
  .confirm-re-absorb-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    text-align: center;
    background-image: url("/images/texture-2.png");
    background-size: 200px;

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
