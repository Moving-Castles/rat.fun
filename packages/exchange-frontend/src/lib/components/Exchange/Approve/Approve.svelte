<script lang="ts">
  import { exchangeState, EXCHANGE_STATE } from "$lib/components/Exchange/state.svelte"
  import { sendApproveFakeToken } from "$lib/modules/action-manager/index.svelte"
  import { playerFakeTokenAllowance } from "$lib/modules/erc20Listener/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  import { SmallSpinner, BigButton } from "$lib/components/Shared"

  $effect(() => {
    if ($playerFakeTokenAllowance > 0) {
      exchangeState.state.transitionTo(EXCHANGE_STATE.EXCHANGE)
    }
  })

  const onClick = () => {
    sendApproveFakeToken()
    // Wait for result in $effect block above
  }

  let isBusy = $derived(busy.ApproveFakeToken.current !== 0)
</script>

<div class="approve">
  {#if isBusy}
    <div class="loading">Approving allowance <SmallSpinner soundOn /></div>
  {:else}
    <div class="button-container">
      <BigButton text="Approve $FAKERAT allowance" disabled={isBusy} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .approve {
    text-align: center;
    color: var(--white);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px;
    }

    .button-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
      overflow: hidden;
      width: 90%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  }
</style>
