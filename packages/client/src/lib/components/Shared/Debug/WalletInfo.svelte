<script lang="ts">
  import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
  import { playerAddress } from "$lib/modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"
  import { player } from "$lib/modules/state/base/stores"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/state/base/stores"
  import { sendGiveCallerTokens } from "$lib/modules/action-manager/index.svelte"

  let { walletType, environment }: { walletType: WALLET_TYPE; environment: ENVIRONMENT } = $props()

  let isMinimized = $state(true)

  function toggleMinimize() {
    isMinimized = !isMinimized
  }
</script>

<div class="wallet-info" class:minimized={isMinimized}>
  <button class="toggle-btn" onclick={toggleMinimize} title={isMinimized ? "Maximize" : "Minimize"}>
    {#if isMinimized}
      ⬆️
    {:else}
      ⬇️
    {/if}
  </button>

  {#if !isMinimized}
    <p>Environment: {environment}</p>
    <p>Wallet Type: {walletType}</p>
    <p>Player Address: {$playerAddress}</p>
    <p>Spawned: {$player?.entityType == ENTITY_TYPE.PLAYER}</p>
    <p>Tokens: {$playerERC20Balance}</p>
    <p>Allowance: {$playerERC20Allowance}</p>
    <button onclick={sendGiveCallerTokens}>Get tokens</button>
  {/if}
</div>

<style lang="scss">
  .wallet-info {
    position: fixed;
    bottom: 5px;
    right: 5px;
    background-color: rgb(11, 255, 84);
    color: var(--background);
    padding: 5px;
    font-size: 16px;
    font-family: var(--special-font-stack);
    border-radius: 4px;
    transition: all 0.2s ease;
    line-height: 1.3em;

    p {
      margin: 0;
    }

    &.minimized {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .toggle-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background: none;
    border: none;
    color: var(--background);
    font-size: 12px;
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }
</style>
