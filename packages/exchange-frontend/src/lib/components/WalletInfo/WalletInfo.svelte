<script lang="ts">
  import { playerAddress, player } from "$lib/modules/state/stores"
  import { playerFakeTokenBalance, playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { shortenAddress } from "$lib/modules/utils"
  import { disconnectWallet } from "$lib/modules/entry-kit/connector"
  import { SmallButton } from "$lib/components/Shared"

  let showDropdown = $state(false)
  let dropdownElement = $state<HTMLElement | undefined>(undefined)
  let walletBoxElement = $state<HTMLElement | undefined>(undefined)

  function toggleDropdown() {
    showDropdown = !showDropdown
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node
    const isClickOnDropdown = dropdownElement && dropdownElement.contains(target)
    const isClickOnWalletBox = walletBoxElement && walletBoxElement.contains(target)

    if (!isClickOnDropdown && !isClickOnWalletBox) {
      showDropdown = false
    }
  }

  async function handleDisconnect() {
    await disconnectWallet()
    showDropdown = false
    // Reload the page to reset state
    window.location.reload()
  }

  // Add/remove click listener when dropdown state changes
  $effect(() => {
    if (showDropdown) {
      document.addEventListener("click", handleClickOutside)
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  })

  // Only show if wallet is connected (playerAddress is not the default value)
  let isConnected = $derived($playerAddress && $playerAddress !== "0x0")
</script>

{#if isConnected}
  <div class="wallet-info">
    <button class="wallet-box" bind:this={walletBoxElement} onclick={toggleDropdown}>
      <div class="address">{shortenAddress($playerAddress)}</div>
      {#if $player?.name}
        <div class="name">{$player.name}</div>
      {/if}
    </button>

    {#if showDropdown}
      <div class="dropdown" bind:this={dropdownElement}>
        <div class="dropdown-content">
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value">{shortenAddress($playerAddress)}</span>
          </div>
          {#if $player?.name}
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">{$player.name}</span>
            </div>
          {/if}
          <div class="info-row">
            <span class="label">$FAKERAT:</span>
            <span class="value">{$playerFakeTokenBalance}</span>
          </div>
          <div class="info-row">
            <span class="label">$RAT:</span>
            <span class="value">{$playerERC20Balance}</span>
          </div>
          <div class="button-container">
            <SmallButton text="Disconnect wallet" onclick={handleDisconnect} />
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .wallet-info {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 2000;
    font-family: var(--typewriter-font-stack);

    .wallet-box {
      background: var(--background-dark-transparent);
      border: 1px solid var(--color-border);
      padding: 12px 16px;
      cursor: pointer;
      color: var(--white);
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-small);
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.9);
      }

      .address {
        font-weight: bold;
      }

      .name {
        font-size: var(--font-size-tiny);
        opacity: 0.8;
      }
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: var(--background-dark-transparent);
      border: 1px solid var(--color-border);
      padding: 16px;
      min-width: 280px;
      color: var(--white);
      font-size: var(--font-size-small);

      .dropdown-content {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;

          .label {
            opacity: 0.7;
          }

          .value {
            font-weight: bold;
          }
        }

        .button-container {
          margin-top: 8px;
        }
      }
    }
  }
</style>
