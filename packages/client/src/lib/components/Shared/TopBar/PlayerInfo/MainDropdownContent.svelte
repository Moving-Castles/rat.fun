<script lang="ts">
  import { playerAddress, player } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  // import { playSound } from "$lib/modules/sound"
  // import { sendBuyWithEth } from "$lib/modules/action-manager/index.svelte"
  // import { BigButton } from "$lib/components/Shared"
  // import { busy } from "$lib/modules/action-manager/index.svelte"
  import { shortenAddress } from "$lib/modules/utils"
  import { SmallButton } from "$lib/components/Shared"
  import { disconnectWallet } from "$lib/modules/entry-kit/connector"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { strings } from "$lib/modules/strings"
</script>

<div class="main-dropdown-content">
  <!-- Name -->
  <div class="tab">
    <p class="key">{strings.name}:</p>
    <p class="value">
      {$player?.name ?? ""}
    </p>
  </div>
  <!-- Wallet -->
  <div class="tab">
    <p class="key">{strings.connectedWallet}:</p>
    <p class="value">
      {shortenAddress($playerAddress)}
    </p>
  </div>
  <!-- Balance -->
  <div class="tab">
    <p class="key">{strings.balance}:</p>
    <p class="value">
      {CURRENCY_SYMBOL}{$playerERC20Balance}
    </p>
  </div>
  <!-- Rats killed -->
  {#if ($player?.pastRats ?? []).length > 0}
    <div class="tab">
      <p class="key">{strings.ratAmountKilled}:</p>
      <p class="value">
        {$player?.pastRats.length}
      </p>
    </div>
  {/if}
  <SmallButton
    tippyText={strings.disconnectWallet}
    onclick={async () => {
      console.log("[MainDropdownContent] Disconnect button clicked")
      await disconnectWallet()
      console.log("[MainDropdownContent] Disconnect complete, returning to spawn")
      UIState.set(UI.SPAWNING)
    }}
    text={strings.disconnectWallet}
  ></SmallButton>
</div>

<style lang="scss">
  .main-dropdown-content {
    .buy-button-container {
      display: flex;
      flex-flow: column nowrap;
      margin-bottom: 8px;
      height: 160px;
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
