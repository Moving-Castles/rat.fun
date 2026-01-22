<script lang="ts">
  import { claimFlowState } from "./state.svelte"
  import { BigButton } from "$lib/components/Shared"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { claimState, CLAIM_STATE } from "../state.svelte"

  async function handleTryAnotherWallet() {
    await getDrawbridge().disconnectWallet()
    claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)
  }
</script>

<div class="error">
  <h2>Something went wrong</h2>
  {#if claimFlowState.data.errorMessage}
    <p class="message">{claimFlowState.data.errorMessage}</p>
  {/if}
  <div class="button-container">
    <BigButton text="Try again" onclick={handleTryAnotherWallet} />
  </div>
</div>

<style lang="scss">
  .error {
    text-align: center;
    padding: 2rem;
    color: var(--white);
    display: flex;
    flex-direction: column;
    align-items: center;

    h2 {
      color: red;
      margin-bottom: 1rem;
    }

    .message {
      opacity: 0.7;
      font-size: var(--font-size-small);
      font-family: var(--typewriter-font-stack);
      max-width: 400px;
      word-break: break-word;
    }

    .button-container {
      width: 100%;
      height: 160px;
      margin-top: 1rem;
    }
  }
</style>
