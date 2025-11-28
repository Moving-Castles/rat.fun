<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { BigButton } from "$lib/components/Shared"
  import { player } from "$lib/modules/state/stores"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { Mascot } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  // Not enough balance
  let disabled = $derived(($playerERC20Balance ?? 0) < Number($gameConfig?.ratCreationCost ?? 0))

  const onClick = async () => {
    ratState.state.transitionTo(RAT_BOX_STATE.DEPLOYING_RAT)
  }

  const onSpawnClick = async () => {
    // Triggers the Spawn flow, defined in @Spawn.svelte
    UIState.set(UI.SPAWNING)
  }
</script>

<div class="deploy-rat">
  <div class="inner-container">
    <div class="mascot-container">
      <Mascot entranceOn={true} smallDanceOn={true} />
    </div>
    <div class="button-container">
      {#if $player}
        <BigButton
          type="buy_rat"
          text={UI_STRINGS.buyRat}
          cost={Number($gameConfig?.ratCreationCost)}
          {disabled}
          extraBig={true}
          onclick={onClick}
        />
      {:else}
        <BigButton text={UI_STRINGS.spawn} onclick={onSpawnClick} />
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .deploy-rat {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: visible;
    position: relative;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: -80px;
      overflow: visible;
      position: relative;

      .mascot-container {
        width: 400px;
        height: 400px;
        margin-bottom: 20px;
        overflow: visible;
        position: relative;

        @media (max-width: 800px) {
          width: 300px;
          height: 300px;
        }
      }

      .button-container {
        overflow: hidden;
        width: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
      }
    }
  }
</style>
