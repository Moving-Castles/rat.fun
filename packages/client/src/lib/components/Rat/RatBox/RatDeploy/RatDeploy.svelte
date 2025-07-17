<script lang="ts">
  import { gameConfig, playerERC20Balance } from "$lib/modules/state/base/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  // Not enough balance
  let disabled = $derived(
    ($playerERC20Balance ?? 0) < Number($gameConfig?.gameConfig?.ratCreationCost ?? 0)
  )

  const onClick = async () => {
    // RAT_BOX_STATE.NO_RAT -> RAT_BOX_STATE.DEPLOYING_RAT
    transitionTo(RAT_BOX_STATE.DEPLOYING_RAT)
  }
</script>

<div class="deploy-rat">
  <div class="image-container">
    <img src="/images/rat.png" alt="Rat" />
  </div>
  <div class="button-container">
    <BigButton
      text="Insert rat"
      cost={Number($gameConfig?.gameConfig?.ratCreationCost)}
      {disabled}
      onclick={onClick}
    />
  </div>
</div>

<style lang="scss">
  .deploy-rat {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;

    .image-container {
      display: flex;
      flex-flow: column nowrap;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .button-container {
      position: absolute;
      bottom: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(50%);
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
