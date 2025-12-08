<script lang="ts">
  import { SmallButton } from "$lib/components/Shared"

  let { show = $bindable(false) }: { show: boolean } = $props()

  const WALLET_DEEPLINKS: Record<string, { ios: string; android: string; name: string }> = {
    coinbase: {
      ios: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Frat.fun",
      android: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Frat.fun",
      name: "BASE"
    },
    metamask: {
      ios: "https://link.metamask.io/dapp/rat.fun",
      android: "https://link.metamask.io/dapp/rat.fun",
      name: "MetaMask"
    },
    phantom: {
      ios: "https://phantom.app/ul/browse/https%3A%2F%2Frat.fun",
      android: "https://phantom.app/ul/browse/https%3A%2F%2Frat.fun",
      name: "Phantom"
    },
    rabby: {
      ios: "rabby://dapp?url=https%3A%2F%2Frat.fun",
      android: "rabby://dapp?url=https%3A%2F%2Frat.fun",
      name: "Rabby"
    }
  }

  function openWalletDeeplink(walletId: string) {
    const deeplink = WALLET_DEEPLINKS[walletId]
    if (!deeplink) return

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isIOS ? deeplink.ios : deeplink.android

    window.location.href = url
  }
</script>

{#if show}
  <div class="wallet-modal">
    <div class="modal-content">
      <button class="close-btn" onclick={() => (show = false)}>×</button>
      <h2>Open in wallet app</h2>
      <div class="wallet-options">
        {#each Object.entries(WALLET_DEEPLINKS) as [walletId, wallet]}
          <div class="button-container">
            <SmallButton text={wallet.name} onclick={() => openWalletDeeplink(walletId)} />
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .wallet-modal {
    position: fixed;
    inset: 0;
    background: var(--background-dark-transparent);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

    .modal-content {
      background: var(--background);
      color: var(--foreground);
      border: 2px solid var(--foreground);
      padding: 32px;
      max-width: 400px;
      width: 90%;
      position: relative;

      .close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: transparent;
        color: var(--foreground);
        border: none;
        font-size: var(--font-size-large);
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;

        &:hover {
          opacity: 0.7;
        }
      }

      h2 {
        margin: 0 0 24px 0;
        font-size: var(--font-size-large);
        text-align: center;
      }

      .wallet-options {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .button-container {
          height: 50px;
        }
      }
    }
  }
</style>
