<script lang="ts">
  import { playerAddress } from "$lib/modules/state/stores"
  import { onMount, onDestroy } from "svelte"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/state/stores"
  import {
    sendGiveCallerTokens,
    sendApproveMax,
    sendBuyWithEth
  } from "$lib/modules/action-manager/index.svelte"
  import { SmallButton } from "$lib/components/Shared"
  import { playSound } from "$lib/modules/sound"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { player } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  let { close } = $props()

  onMount(() => {
    playSound("ratfun", "textLineHit")
  })

  onDestroy(() => {
    playSound("ratfun", "textLineHit")
  })
</script>

<div class="account-stats">
  <div class="tab">
    <p class="key">Your address:</p>
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
  <div class="actions">
    <SmallButton
      disabled={busy.GiveCallerTokens.current !== 0}
      tippyText="Request tokens from the contract"
      extraClass="red"
      onclick={async () => {
        await sendGiveCallerTokens()
        playSound("ratfun", "coins")
      }}
      text="Get 2000 free $SLopamine"
    ></SmallButton>
    <SmallButton
      disabled={busy.BuyWithEth.current !== 0}
      tippyText="Buy some $Slopamine"
      onclick={async () => {
        await sendBuyWithEth()
        playSound("ratfun", "coins")
      }}
      text="Buy 1 $Slopamine for 0.001ETH"
    ></SmallButton>
    <SmallButton
      disabled={busy.ApproveMax.current !== 0}
      tippyText="Allow the contract to spend on your behalf"
      onclick={async () => {
        await sendApproveMax()
        playSound("ratfun", "coins")
      }}
      text="Approve max allowance"
    ></SmallButton>
  </div>
</div>

<style lang="scss">
  .account-stats {
    position: fixed;
    top: 68px;
    left: 8px;
    background-color: var(--background-semi-transparent);
    color: var(--white);
    padding: 20px;
    transition: all 0.2s ease;
    line-height: 1.3em;
    z-index: 1;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: 20px;
    font-family: var(--special-font-stack);
    z-index: 99;
    border: 1px solid var(--color-border);

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

      .key {
        width: 140px;
      }
    }
  }
</style>
