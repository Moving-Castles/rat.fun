<script lang="ts">
  import { claimFlowState } from "./state.svelte"
</script>

<div class="claiming">
  <p>Claiming your $RAT...</p>
  {#if claimFlowState.data.txHash}
    <p class="tx-hash">
      Transaction: {claimFlowState.data.txHash.slice(0, 10)}...
    </p>
  {/if}
</div>

<style lang="scss">
  .claiming {
    text-align: center;
    padding: 2rem;

    .tx-hash {
      font-size: 0.8rem;
      opacity: 0.7;
      margin-top: 1rem;
    }
  }
</style>
