<script lang="ts">
  import {
    playerAddress,
    playerERC20Allowance,
    playerERC20Balance,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { sendApproveMax, sendBuyWithEth } from "$lib/modules/action-manager/index.svelte"
  import { SmallButton, BigButton } from "$lib/components/Shared"
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
      {$playerERC20Balance} $slop
    </p>
  </div>
  <div class="buy-button-container">
    <BigButton
      disabled={busy.BuyWithEth.current !== 0}
      tippyText="Buy some $Slopamine"
      onclick={async () => {
        await sendBuyWithEth()
        playUISound("ratfun", "coins")
      }}
      text="Buy $Slopamine"
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
