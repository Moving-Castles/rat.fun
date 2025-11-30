<script lang="ts">
  import { exchangeFlowState } from "./state.svelte"
  import { BigButton } from "$lib/components/Shared"

  const basescanUrl = exchangeFlowState.data.exchangeTxHash
    ? `https://basescan.org/tx/${exchangeFlowState.data.exchangeTxHash}`
    : null

  function goToRatFun() {
    window.location.href = "https://rat.fun"
  }
</script>

<div class="complete">
  <div class="info">
    <p>Exchange complete</p>
    <p>You received {exchangeFlowState.data.exchangeAmount} $RAT tokens</p>
    {#if basescanUrl}
      <a href={basescanUrl} target="_blank" rel="noopener noreferrer" class="tx-link">
        View transaction on Basescan
      </a>
    {/if}
  </div>
  <div class="button-container">
    <BigButton text="Go to rat.fun" onclick={goToRatFun} />
  </div>
</div>

<style lang="scss">
  .complete {
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
      background: lightgreen;
      padding: 20px;

      p {
        margin: 5px 0;
      }

      .tx-link {
        display: block;
        margin-top: 10px;
        font-size: var(--font-size-small);
        color: black;
        text-decoration: underline;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
