<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE, getItemState } from "../state.svelte"

  let { item } = getItemState()

  $inspect(item.current)

  const onClickConfirm = () => {
    console.log("RE_ABSORBING_ITEM")
    transitionTo(RAT_BOX_STATE.RE_ABSORBING_ITEM)
  }

  const onClickAbort = () => {
    item.set("")
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-re-absorb-item">
  <div class="confirm-re-absorb-item-text">
    <h1>Will you re-absorb {item.entity.name}?</h1>
  </div>
  <div class="button-container">
    <BigButton text="Confirm" onclick={onClickConfirm} />
    <BigButton text="Abort" onclick={onClickAbort} />
  </div>
  <p>
    You will recover
    <span class="value"
      >{Math.floor((Number(item.entity.value) * (100 - $gameConfig.taxationReAbsorbItem)) / 100)} SLOPAMINE</span
    >
  </p>
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

    .value {
      background: var(--color-value);
      color: var(--black);
      padding: 5px;
    }
  }
</style>
