<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import {
    player,
    playerAddress,
    playerIsNew,
    playerIsBroke,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import {
    sendGiveCallerTokens,
    sendApproveMax,
    sendBuyWithEth
  } from "$lib/modules/action-manager/index.svelte"
  import { sendChatMessage } from "$lib/modules/off-chain-sync"
  import { SmallButton } from "$lib/components/Shared"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { adminUnlockedAt } from "$lib/modules/ui/state.svelte"

  const sendUnlockAdmin = async () => {
    await sendChatMessage("RatsRiseUp666")
    $adminUnlockedAt = Date.now()
  }
</script>

<div class="debug-dropdown-content">
  <div class="tab">
    <p class="key">Address:</p>
    <p class="value">
      {$playerAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">Environment</p>
    <p class="value">{$environment}</p>
  </div>
  <div class="tab">
    <p class="key">Wallet Type:</p>
    <p class="value">
      {$walletType}
    </p>
  </div>
  <div class="tab">
    <p class="key">Spawned:</p>
    <p class="value">
      {$player?.entityType == ENTITY_TYPE.PLAYER}
    </p>
  </div>
  <div class="tab">
    <p class="key">Tokens:</p>
    <p class="value">
      {$playerERC20Balance}
    </p>
  </div>
  <div class="tab">
    <p class="key">Allowance:</p>
    <p class="value">
      {$playerERC20Allowance}
    </p>
  </div>
  <div class="tab">
    <p class="key">Is new:</p>
    <p class="value">
      {$playerIsNew}
    </p>
  </div>
  <div class="tab">
    <p class="key">Is broke:</p>
    <p class="value">
      {$playerIsBroke}
    </p>
  </div>
  <div class="actions">
    <SmallButton
      disabled={busy.GiveCallerTokens.current !== 0}
      tippyText="Request tokens from the contract"
      onclick={async () => {
        await sendGiveCallerTokens()
        // playSound("ratfunUI", "coins")
      }}
      text="Get 2000 free slopamine ({CURRENCY_SYMBOL})"
    ></SmallButton>
    <SmallButton
      disabled={busy.BuyWithEth.current !== 0}
      tippyText="Buy some slopamine ({CURRENCY_SYMBOL})"
      onclick={async () => {
        await sendBuyWithEth()
        // playSound("ratfunUI", "coins")
      }}
      text="Buy 1 Slopamine ({CURRENCY_SYMBOL}) for 0.001ETH"
    ></SmallButton>
    <SmallButton
      disabled={busy.ApproveMax.current !== 0 || $tokenAllowanceApproved}
      tippyText="Allow the contract to spend on your behalf"
      onclick={async () => {
        await sendApproveMax()
      }}
      text="Approve max allowance"
    ></SmallButton>
    <SmallButton
      tippyText="Unlock admin mode"
      onclick={async () => {
        await sendUnlockAdmin()
      }}
      disabled={$player?.masterKey}
      text="Unlock admin mode"
    ></SmallButton>
  </div>
</div>

<style lang="scss">
  .debug-dropdown-content {
    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 8px;
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
        width: 140px;
      }
    }
  }
</style>
