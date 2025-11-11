<script lang="ts">
  import { exchangeState, EXCHANGE_STATE } from "$lib/components/Exchange/state.svelte"
  import { playerFakeTokenBalance } from "$lib/modules/erc20Listener/stores"

  $effect(() => {
    if ($playerFakeTokenBalance > 0) {
      exchangeState.state.transitionTo(EXCHANGE_STATE.APPROVE)
    }
  })
</script>

<div class="no-tokens">
  <div class="notice">No $FAKERAT found</div>
</div>

<style lang="scss">
  .no-tokens {
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

    .notice {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px;
    }
  }
</style>
