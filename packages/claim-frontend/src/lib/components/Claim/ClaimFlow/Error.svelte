<script lang="ts">
  import { claimFlowState } from "./state.svelte"
</script>

<div class="error">
  <h2>Something went wrong</h2>
  {#if claimFlowState.data.errorMessage}
    <p class="message">{claimFlowState.data.errorMessage}</p>
  {/if}
</div>

<style lang="scss">
  .error {
    text-align: center;
    padding: 2rem;
    color: var(--white);

    h2 {
      color: orangered;
      margin-bottom: 1rem;
    }

    .message {
      opacity: 0.8;
      font-size: 0.9rem;
    }
  }
</style>
