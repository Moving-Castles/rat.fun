<script lang="ts">
  import { playerAddress, player } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { shortenAddress } from "$lib/modules/utils"
  import { disconnectWallet } from "$lib/modules/entry-kit/connector"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { strings } from "$lib/modules/strings"
  import { walletType } from "$lib/modules/network"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SmallButton } from "$lib/components/Shared"
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
  {#if $walletType !== WALLET_TYPE.BURNER}
    <SmallButton
      tippyText={strings.disconnectWallet}
      onclick={async () => {
        await disconnectWallet()
        UIState.set(UI.SPAWNING)
      }}
      text={strings.disconnectWallet}
    ></SmallButton>
  {/if}
</div>

<style lang="scss">
  .main-dropdown-content {
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
