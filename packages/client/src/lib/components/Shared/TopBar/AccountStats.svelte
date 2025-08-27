<script lang="ts">
  import { getQueryClientContext } from "@tanstack/svelte-query"
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

  let isMinimized = $state(true)

  const queryClient = getQueryClientContext()

  function toggleMinimize() {
    isMinimized = !isMinimized
  }

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
      tippyText="Request tokens from the contract"
      onclick={() => sendGiveCallerTokens(queryClient)}
      text="Get tokens"
    ></SmallButton>
    <SmallButton
      tippyText="Buy some $Slopamine"
      onclick={sendBuyWithEth}
      text="Buy $Slopamine (0.001ETH)"
    ></SmallButton>
    <SmallButton
      tippyText="Allow the contract to spend on your behalf"
      onclick={() => sendApproveMax(queryClient)}
      text="Approve max allowance"
    ></SmallButton>
  </div>
</div>

<style lang="scss">
  .account-stats {
    position: fixed;
    top: 60px;
    left: 0px;
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
