<script lang="ts">
  import {
    player,
    playerAddress,
    playerIsNew,
    playerHasTokens,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import {
    sendGiveCallerTokens,
    sendApprove,
    sendBuyWithEth,
    sendLiquidateRat
  } from "$lib/modules/action-manager/index.svelte"
  import { SmallButton } from "$lib/components/Shared"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { ENVIRONMENT } from "$lib/mud/enums"
  import { publicNetwork } from "$lib/modules/network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"

  const MAX_ALLOWANCE = 1_000_000n
</script>

<div class="debug-dropdown-content">
  <div class="tab">
    <p class="key">{UI_STRINGS.address}:</p>
    <p class="value">
      {$playerAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.environment}</p>
    <p class="value">{$environment}</p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.walletType}:</p>
    <p class="value">
      {$walletType}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.worldAddress}:</p>
    <p class="value">
      {$publicNetwork.worldAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.player}:</p>
    <p class="value">
      {$player?.entityType == ENTITY_TYPE.PLAYER}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.balance}:</p>
    <p class="value">
      {$playerERC20Balance}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.allowance}:</p>
    <p class="value">
      {$playerERC20Allowance}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.newIndication}:</p>
    <p class="value">
      {$playerIsNew}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.hasTokens}:</p>
    <p class="value">
      {$playerHasTokens}
    </p>
  </div>
  <div class="tab">
    <p class="key">{UI_STRINGS.adminUnlocked}:</p>
    <p class="value">
      {$player?.masterKey}
    </p>
  </div>
  <div class="actions">
    {#if $environment !== ENVIRONMENT.BASE}
      <SmallButton
        disabled={busy.GiveCallerTokens.current !== 0}
        tippyText={UI_STRINGS.requestTokens}
        onclick={async () => {
          await sendGiveCallerTokens()
        }}
        text={UI_STRINGS.getFreeTokens(2000)}
      ></SmallButton>
      <SmallButton
        disabled={busy.BuyWithEth.current !== 0}
        tippyText={UI_STRINGS.buySomeTokens}
        onclick={async () => {
          await sendBuyWithEth()
        }}
        text={UI_STRINGS.buyTokens(1)}
      ></SmallButton>
    {/if}
    <SmallButton
      disabled={busy.Approve.current !== 0 || $tokenAllowanceApproved}
      tippyText={UI_STRINGS.approveAllowanceInstruction}
      onclick={async () => {
        await sendApprove(MAX_ALLOWANCE)
      }}
      text={UI_STRINGS.approveAllowance}
    ></SmallButton>
    <SmallButton
      disabled={busy.Approve.current !== 0 || !$tokenAllowanceApproved}
      tippyText={UI_STRINGS.revokeApprovalInstruction}
      onclick={async () => {
        await sendApprove(0n)
      }}
      text={UI_STRINGS.revokeApproval}
    ></SmallButton>
    <SmallButton
      tippyText={UI_STRINGS.forceRatLiquidation}
      onclick={async () => {
        await sendLiquidateRat()
      }}
      text={UI_STRINGS.forceRatLiquidation}
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
