<script lang="ts">
  import { goto } from "$app/navigation"
  import { gameConfig } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { BigButton } from "$lib/components/Shared"
  import { player } from "$lib/modules/state/stores"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  // Not enough balance
  let disabled = $derived(($playerERC20Balance ?? 0) < Number($gameConfig?.ratCreationCost ?? 0))

  const onClick = async () => {
    transitionTo(RAT_BOX_STATE.DEPLOYING_RAT)
  }

  const onSpawnClick = async () => {
    // ???
    await goto("?spawn")
    UIState.set(UI.SPAWNING)
  }
</script>

<div class="deploy-rat">
  <!-- <div class="image-container">
    <img style:filter src="/images/mascot1.png" alt="Rat" />
  </div> -->
  <div class="button-container">
    {#if $player}
      <BigButton
        id="buy_rat"
        text="Buy rat"
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
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 100% 20%;
        opacity: 0.8;
      }
    }

    .button-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }
  }
</style>
