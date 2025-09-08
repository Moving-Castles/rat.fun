<script lang="ts">
  import { BigButton, ValueBreakdown } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE, getItemState } from "../RatBox/state.svelte"

  let { item } = getItemState()

  const onClickConfirm = () => {
    transitionTo(RAT_BOX_STATE.RE_ABSORBING_ITEM)
  }

  const onClickAbort = () => {
    item.set("")
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-re-absorb-item">
  <div class="confirm-re-absorb-item-text">
    <h1>
      Will you re-absorb {item.entity.name}?
    </h1>
    <ValueBreakdown
      originalValue={Number(item.entity.value)}
      originalLabel="Item value"
      taxRateKey="taxationReAbsorbItem"
    />
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

    .confirm-re-absorb-item-text {
      width: 80%;
      padding-bottom: 10px;
      color: var(--background);
    }

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
