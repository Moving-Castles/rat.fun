<script lang="ts">
  import { BigButton } from "$lib/components/Shared"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { claimState, CLAIM_STATE } from "../state.svelte"

  async function handleTryAnotherWallet() {
    await getDrawbridge().disconnectWallet()
    claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)
  }
</script>

<div class="not-eligible">
  <div class="content">
    <h2>Not Eligible</h2>
    <p>Based on our performance review you are not eligible for the grant.</p>
  </div>
  <div class="button-container">
    <BigButton text="Try another wallet" onclick={handleTryAnotherWallet} />
  </div>
</div>

<style lang="scss">
  .not-eligible {
    text-align: center;
    color: var(--white);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;

    .content {
      max-width: 400px;

      h2 {
        margin-bottom: 1rem;
      }

      p {
        opacity: 0.8;
      }
    }
    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
