<script lang="ts">
  import { exchangeState, EXCHANGE_STATE } from "$lib/components/Exchange/state.svelte"
  import { sendExchangeFakeToken } from "$lib/modules/action-manager/index.svelte"
  import { playerFakeTokenBalance } from "$lib/modules/erc20Listener/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  import { SmallSpinner, BigButton } from "$lib/components/Shared"

  const onClick = async () => {
    try {
      await sendExchangeFakeToken($playerFakeTokenBalance)
      // Transaction completed successfully, transition to DONE
      exchangeState.state.transitionTo(EXCHANGE_STATE.DONE)
    } catch (e) {
      console.error("Failed to exchange tokens", e)
    }
  }

  let isBusy = $derived(busy.ExchangeFakeToken.current !== 0)
</script>

<div class="exchange-form">
  {#if isBusy}
    <div class="loading">Exchanging tokens <SmallSpinner soundOn /></div>
  {:else}
    <div class="info">
      <p>You have {$playerFakeTokenBalance} $FAKERAT tokens</p>
      <p>Exchange them for {$playerFakeTokenBalance} $RAT tokens</p>
    </div>
    <div class="button-container">
      <BigButton
        text="Exchange all tokens"
        disabled={isBusy || $playerFakeTokenBalance === 0}
        onclick={onClick}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .exchange-form {
    text-align: center;
    color: var(--white);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .loading {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px;
    }

    .info {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: var(--white);
      padding: 20px;
      margin-bottom: 20px;

      p {
        margin: 5px 0;
      }
    }

    .button-container {
      width: 90%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  }
</style>
