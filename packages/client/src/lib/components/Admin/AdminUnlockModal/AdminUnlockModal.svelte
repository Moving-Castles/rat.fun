<script lang="ts">
  import { busy, sendUnlockAdmin } from "$lib/modules/action-manager/index.svelte"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { refetchBalance } from "$lib/modules/erc20Listener"
  import { BigButton, SmallSpinner } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let unlockingAdmin = $state(false)

  const unlockAdmin = async () => {
    unlockingAdmin = true
    await sendUnlockAdmin()
    refetchBalance()
  }
</script>

<!-- Unlock Admin Overlay -->
<div class="unlock-overlay">
  <div class="unlock-modal">
    {#if unlockingAdmin || busy.UnlockAdmin.current !== 0}
      <!-- Loading State -->
      <h2>Unlocking Cashboard</h2>
      <div class="loading-spinner">
        <SmallSpinner />
      </div>
      <p>Transaction in progress...</p>
    {:else}
      <!-- Initial State -->
      <h2>{UI_STRINGS.unlockAdminHeader}</h2>
      <p>{UI_STRINGS.unlockAdminMessage}</p>
      <div class="unlock-cost">
        Cost: 500 {CURRENCY_SYMBOL}
      </div>
      {#if $playerERC20Balance < 500}
        <div class="insufficient-balance">
          Insufficient balance ({$playerERC20Balance}
          {CURRENCY_SYMBOL})
        </div>
      {/if}
      <div class="unlock-button-container">
        <BigButton
          text="Unlock"
          onclick={unlockAdmin}
          disabled={$playerERC20Balance < 500 || busy.UnlockAdmin.current !== 0}
        />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .unlock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .unlock-modal {
    background: var(--background-semi-transparent);
    border: var(--default-border-style);
    padding: 40px;
    border-radius: 4px;
    text-align: center;
    max-width: 500px;
    width: 90%;

    h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: var(--color-white);
    }

    p {
      font-size: 16px;
      margin-bottom: 30px;
      color: var(--color-grey-light);
    }

    .unlock-cost {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      color: var(--color-white);
    }

    .insufficient-balance {
      font-size: 14px;
      color: var(--color-error);
      margin-bottom: 20px;
    }

    .loading-spinner {
      font-size: 32px;
      margin: 30px 0;
      color: var(--color-white);
    }
  }

  .unlock-button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    height: 160px;
  }
</style>
