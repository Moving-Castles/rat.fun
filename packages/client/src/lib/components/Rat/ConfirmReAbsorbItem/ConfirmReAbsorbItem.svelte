<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
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
    <div class="value-breakdown">
      <div class="value-line">
        Item value: <span class="value">{item.entity.value} SLOPAMINE</span>
      </div>
      <div class="value-line">
        TraumwertSteuer ({$gameConfig.taxationReAbsorbItem}%):
        <span class="value negative"
          >-{Math.floor((Number(item.entity.value) * $gameConfig.taxationReAbsorbItem) / 100)} SLOPAMINE</span
        >
      </div>
      <div class="value-line">
        Payout: <span class="value payout"
          >{Math.floor(
            (Number(item.entity.value) * (100 - $gameConfig.taxationReAbsorbItem)) / 100
          )} SLOPAMINE</span
        >
      </div>
    </div>
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

    .value-breakdown {
      margin-top: 20px;
      text-align: left;
      font-size: var(--font-size-normal);
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      color: var(--foreground);
    }

    .value-line {
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .value {
      background: var(--color-value);
      color: var(--black);
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;

      &.negative {
        background: var(--color-death);
        color: var(--background);
      }

      &.payout {
        background: var(--color-success);
        color: var(--black);
      }
    }
  }
</style>
