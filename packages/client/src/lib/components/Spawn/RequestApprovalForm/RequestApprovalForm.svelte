<script lang="ts">
  import { gameConfig } from "$lib/modules/state/base/stores"
  import { approveMax } from "$lib/modules/on-chain-action"

  import { BigButton } from "$lib/components/Shared"

  const { onComplete = () => {} } = $props<{
    onComplete: () => void
  }>()

  async function sendApproval() {
    try {
      await approveMax($gameConfig.externalAddressesConfig.gamePoolAddress)
    } catch (e) {
      console.error(e)
    }
    onComplete()
  }
</script>

<div class="container">
  <div class="main">
    <div class="content">
      <div class="form">
        <p>Approve token transfer</p>
        <BigButton text="APPROVE" onclick={sendApproval} />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-large);
  }

  .main {
    width: 100%;
    height: 100%;
    max-width: calc(var(--game-window-width) * 0.9);
    padding: 10px 30px;
    padding-bottom: 30px;
    max-width: 60ch;
  }

  p {
    margin-bottom: 1em;
  }
</style>
