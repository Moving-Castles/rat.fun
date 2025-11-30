<script lang="ts">
  import { exchangeFlowState } from "./state.svelte"
</script>

<div class="error">
  <div class="message">
    <p>Exchange failed</p>
    {#if exchangeFlowState.data.errorMessage}
      <p class="details">{exchangeFlowState.data.errorMessage}</p>
    {/if}
  </div>

  <button class="retry" onclick={() => window.location.reload()}>Try again</button>
</div>

<style lang="scss">
  .error {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .message {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 20px;

      p {
        margin: 5px 0;
      }

      .details {
        font-size: var(--font-size-small);
        opacity: 0.8;
        max-width: 400px;
        word-break: break-word;
      }
    }

    .retry {
      font-size: var(--font-size-small);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: var(--white);
      border: none;
      padding: 10px 20px;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }
    }
  }
</style>
