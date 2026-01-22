<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"
  import {
    WalletSelectModal,
    NoWalletsModal,
    DeepLinkSelectModal,
    generateWalletDeeplinks
  } from "@ratfun/shared-ui/WalletModals"

  const WALLET_DEEPLINKS = generateWalletDeeplinks("iwasgoodstump.rat.fun")
  import { createWalletConnection } from "@ratfun/shared-ui/WalletConnection"

  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  // Create wallet connection
  const wallet = createWalletConnection({
    getDrawbridge,
    isPhone: $isPhone,
    onError: (error, message) => console.error(message, error)
  })

  onMount(() => {
    wallet.prepareConnectors()

    if (!buttonElement) {
      return
    }

    // Set initial opacity to 0
    buttonElement.style.opacity = "0"

    // Animate opacity to 1
    if (buttonElement) {
      timeline.to(buttonElement, {
        opacity: 1,
        duration: 0.4
      })
    }
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <div class="info-box">
      <p>Dear Stump,</p>
      <p>Thank you for your dedication and loyalty to <em>This Cursed Machine</em>.</p>
      <p>
        Although your limbs remain our property, we have partnered with our sister company <em
          >RAT.FUN PSYCHIC INSTRUMENTS LLC</em
        > to reward you with a performance based business grant.
      </p>
      <p>We hope these tokens will help you in your next entrepreneurial venture.</p>
    </div>
    <div class="fine-print">
      Please keep in mind that collecting this grant will brute-force your immediate relocation to
      the Walled State of Kowloon (Hong Kong), as well as syncing your amygdala and substantia nigra
      to our Biological Intelligence Operating System.
    </div>
    <div class="button-container" bind:this={buttonElement}>
      {#if wallet.connecting}
        <BigButton text="Connecting..." disabled={true} onclick={() => {}} />
      {:else}
        <BigButton text="I WAS GOOD STUMP" onclick={wallet.handleClick} />
      {/if}
    </div>

    <NoWalletsModal bind:show={wallet.showNoWalletsModal} />

    <WalletSelectModal
      bind:show={wallet.showWalletSelect}
      connectors={wallet.availableConnectors}
      connecting={wallet.connecting}
      onSelect={wallet.connectWallet}
    />

    <DeepLinkSelectModal bind:show={wallet.showDeepLinkSelect} deeplinks={WALLET_DEEPLINKS} />
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 800px;
      max-width: 90dvw;

      .info-box {
        width: 100%;
        text-align: center;
        margin-bottom: 10px;
        background: var(--foreground);
        color: black;
        padding: 10px;
        text-align: left;
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        line-height: 1.1em;

        @media (max-width: 768px) {
          font-size: var(--font-size-normal);
        }
        p {
          margin: 0;
          margin-bottom: 0.5em;
          padding: 0;
        }
      }

      .fine-print {
        width: 100%;
        text-align: center;
        margin-bottom: 10px;
        background: var(--foreground);
        color: black;
        padding: 10px;
        text-align: left;
        font-family: var(--special-font-stack);
        font-size: 10px;
      }

      .button-container {
        width: 100%;
        height: 200px;
        margin-bottom: 20px;
      }
    }
  }
</style>
