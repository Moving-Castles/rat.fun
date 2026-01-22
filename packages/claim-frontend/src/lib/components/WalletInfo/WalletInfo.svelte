<script lang="ts">
  import { playerERC20Balance, airdropRatBalance } from "$lib/modules/erc20Listener/stores"
  import { getDrawbridge, userAddress } from "$lib/modules/drawbridge"
  import { addRatTokenToWallet } from "$lib/modules/drawbridge/connector"
  import { shortenAddress } from "@ratfun/shared-utils"
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
    await getDrawbridge().disconnectWallet()
    showDropdown = false
    // Reload the page to reset state
    window.location.reload()
  }

  async function handleAddToken() {
    try {
      await addRatTokenToWallet()
    } catch (e) {
      console.error("Failed to add token to wallet:", e)
    }
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

  // Only show if wallet is connected
  let isConnected = $derived(!!$userAddress)
</script>

{#if isConnected}
  <div class="wallet-info">
    <button class="wallet-box" bind:this={walletBoxElement} onclick={toggleDropdown}>
      <div class="address">{shortenAddress($userAddress!)}</div>
    </button>

    {#if showDropdown}
      <div class="dropdown" bind:this={dropdownElement}>
        <div class="dropdown-content">
          <div class="info-row">
            <span class="label">Address:</span>
            <span class="value">{shortenAddress($userAddress!)}</span>
          </div>
          <div class="info-row">
            <span class="label">$RAT:</span>
            <span class="value">{$playerERC20Balance}</span>
          </div>
          <button class="add-token-btn" onclick={handleAddToken}> + Add $RAT to wallet </button>
          <div class="divider"></div>
          <div class="info-row">
            <span class="label">Total available to claim:</span>
            <span class="value">{$airdropRatBalance} $RAT</span>
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
        background: var(--background-dark-transparent);
      }

      .address {
        font-weight: bold;
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

        .divider {
          border-top: 1px solid var(--color-border);
          margin: 4px 0;
        }

        .add-token-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--white);
          font-family: var(--typewriter-font-stack);
          font-size: var(--font-size-small);
          padding: 6px 10px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;

          &:hover {
            opacity: 1;
          }
        }

        .button-container {
          margin-top: 8px;
        }
      }
    }
  }
</style>
