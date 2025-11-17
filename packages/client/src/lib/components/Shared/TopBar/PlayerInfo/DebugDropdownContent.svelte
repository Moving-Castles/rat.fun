<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import {
    player,
    playerAddress,
    playerIsNew,
    playerHasTokens,
    tokenAllowanceApproved,
    balance
  } from "$lib/modules/state/stores"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import {
    sendGiveCallerTokens,
    sendApproveMax,
    sendRevokeApproval,
    sendBuyWithEth,
    sendLiquidateRat,
    sendUnlockAdmin
  } from "$lib/modules/action-manager/index.svelte"
  import { SmallButton } from "$lib/components/Shared"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { ENVIRONMENT } from "$lib/mud/enums"
  import { publicNetwork } from "$lib/modules/network"
  import { strings } from "$lib/modules/strings"
</script>

<div class="debug-dropdown-content">
  <div class="tab">
    <p class="key">{strings.address}:</p>
    <p class="value">
      {$playerAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.environment}</p>
    <p class="value">{$environment}</p>
  </div>
  <div class="tab">
    <p class="key">{strings.walletType}:</p>
    <p class="value">
      {$walletType}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.worldAddress}:</p>
    <p class="value">
      {$publicNetwork.worldAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.player}:</p>
    <p class="value">
      {$player?.entityType == ENTITY_TYPE.PLAYER}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.balance}:</p>
    <p class="value">
      {$playerERC20Balance}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.allowance}:</p>
    <p class="value">
      {$playerERC20Allowance}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.newIndication}:</p>
    <p class="value">
      {$playerIsNew}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.hasTokens}:</p>
    <p class="value">
      {$playerHasTokens}
    </p>
  </div>
  <div class="tab">
    <p class="key">{strings.adminUnlocked}:</p>
    <p class="value">
      {$player?.masterKey}
    </p>
  </div>
  <div class="actions">
    {#if $environment !== ENVIRONMENT.BASE}
      <SmallButton
        disabled={busy.GiveCallerTokens.current !== 0}
        tippyText={strings.requestTokens}
        onclick={async () => {
          await sendGiveCallerTokens()
        }}
        text={strings.getFreeTokens(2000)}
      ></SmallButton>
      <SmallButton
        disabled={busy.BuyWithEth.current !== 0}
        tippyText={strings.buySomeTokens}
        onclick={async () => {
          await sendBuyWithEth()
        }}
        text={strings.buyTokens(1)}
      ></SmallButton>
      <SmallButton
        tippyText={strings.unlockAdminInstruction}
        onclick={async () => {
          await sendUnlockAdmin()
        }}
        disabled={$player?.masterKey}
        text={strings.unlockAdminInstruction}
      ></SmallButton>
    {/if}
    <SmallButton
      disabled={busy.ApproveMax.current !== 0 || $tokenAllowanceApproved}
      tippyText={strings.approveAllowanceInstruction}
      onclick={async () => {
        await sendApproveMax()
      }}
      text={strings.approveAllowance}
    ></SmallButton>
    <SmallButton
      disabled={busy.RevokeApproval.current !== 0 || !$tokenAllowanceApproved}
      tippyText={strings.revokeApprovalInstruction}
      onclick={async () => {
        await sendRevokeApproval()
      }}
      text={strings.revokeApproval}
    ></SmallButton>
    <SmallButton
      tippyText={strings.forceRatLiquidation}
      onclick={async () => {
        await sendLiquidateRat()
      }}
      text={strings.forceRatLiquidation}
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
