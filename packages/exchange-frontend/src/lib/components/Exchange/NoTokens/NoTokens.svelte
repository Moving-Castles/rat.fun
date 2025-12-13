<script lang="ts">
  import { exchangeState, EXCHANGE_STATE } from "$lib/components/Exchange/state.svelte"
  import { fakeRatTokenBalance } from "$lib/modules/erc20Listener/stores"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { BigButton } from "$lib/components/Shared"

  // Watch for balance changes - if user receives tokens, transition to exchange
  $effect(() => {
    if ($fakeRatTokenBalance > 0) {
      exchangeState.state.transitionTo(EXCHANGE_STATE.EXCHANGE)
    }
  })

  async function handleTryAnotherWallet() {
    await getDrawbridge().disconnectWallet()
    exchangeState.state.transitionTo(EXCHANGE_STATE.CONNECT_WALLET)
  }
</script>

<div class="no-tokens">
  <div class="info">
    <p>No $FAKERAT found</p>
  </div>
  <div class="button-container">
    <BigButton text="Try another account" onclick={handleTryAnotherWallet} />
  </div>
</div>

<style lang="scss">
  .no-tokens {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;

    .info {
      width: 100%;
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: var(--color-bad);
      padding: 20px;

      p {
        margin: 5px 0;
      }
    }

    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
