<script lang="ts">
  import { playerAddress } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  // import { playSound } from "$lib/modules/sound"
  import { sendBuyWithEth } from "$lib/modules/action-manager/index.svelte"
  import { BigButton } from "$lib/components/Shared"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { shortenAddress } from "$lib/modules/utils"
</script>

<div class="main-dropdown-content">
  <div class="tab">
    <p class="key">Connected wallet:</p>
    <p class="value">
      {shortenAddress($playerAddress)}
    </p>
  </div>
  <div class="tab">
    <p class="key">Balance:</p>
    <p class="value">
      {CURRENCY_SYMBOL}{$playerERC20Balance}
    </p>
  </div>
  <div class="buy-button-container">
    <BigButton
      disabled={busy.BuyWithEth.current !== 0}
      tippyText="Buy some Slopamine ({CURRENCY_SYMBOL})"
      onclick={async () => {
        await sendBuyWithEth()
        // playSound("ratfunUI", "coins")
      }}
      text="Buy Slopamine ({CURRENCY_SYMBOL})"
    ></BigButton>
  </div>
</div>

<style lang="scss">
  .main-dropdown-content {
    .buy-button-container {
      display: flex;
      flex-flow: column nowrap;
      margin-bottom: 8px;
      height: 80px;
    }

    p {
      margin: 0;
    }

    .tab {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 8px;

      .key {
        width: 240px;
      }
    }
  }
</style>
