<script lang="ts">
  import { gameConfig, playerERC20Balance } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"
  import { player } from "$lib/modules/state/stores"
  import { UIState } from "$lib/modules/ui/stores"
  import { UI } from "$lib/modules/ui/enums"

  // Not enough balance
  let disabled = $derived(($playerERC20Balance ?? 0) < Number($gameConfig?.ratCreationCost ?? 0))

  const onClick = async () => {
    // RAT_BOX_STATE.NO_RAT -> RAT_BOX_STATE.DEPLOYING_RAT
    transitionTo(RAT_BOX_STATE.DEPLOYING_RAT)
  }

  const onSpawnClick = () => {
    UIState.set(UI.SPAWNING)
  }
</script>

<div class="deploy-rat">
  <div class="image-container">
    <img src="/images/mickey-rat.png" alt="Rat" />
  </div>
  <div class="button-container">
    {#if $player}
      <BigButton
        text="Insert rat"
        cost={Number($gameConfig?.ratCreationCost)}
        {disabled}
        onclick={onClick}
      />
    {:else}
      <BigButton text="Spawn" onclick={onSpawnClick} />
    {/if}
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
    background-image: url("/images/texture-2.png");
    background-size: 200px;

    .image-container {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      height: 100%;

      img {
        width: auto;
        height: 60%;
        object-fit: contain;
      }
    }

    .button-container {
      position: absolute;
      bottom: 20%;
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
