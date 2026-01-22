<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"
  import Mascot from "$lib/components/Shared/Mascot/Mascot.svelte"
  import type { TerminalOutputUnit } from "@ratfun/shared-ui/Mascot"
  import {
    WalletSelectModal,
    NoWalletsModal,
    DeepLinkSelectModal,
    generateWalletDeeplinks
  } from "@ratfun/shared-ui/WalletModals"

  const WALLET_DEEPLINKS = generateWalletDeeplinks("sale.rat.fun")
  import { createWalletConnection } from "@ratfun/shared-ui/WalletConnection"
  import { playSound, randomPitch } from "$lib/modules/sound"

  function onType() {
    playSound("ratfunUI", "chirp", false, false, randomPitch())
  }

  const mascotText: TerminalOutputUnit[] = [
    {
      type: "text",
      content: "BUY $RAT",
      typeSpeed: 40,
      typeMode: "char",
      color: "var(--foreground)",
      backgroundColor: "transparent",
      onType
    }
  ]

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
    <div class="mascot-container">
      <Mascot
        headBobOn={true}
        text={mascotText}
        hugeText={true}
        centerText={true}
        bigDanceOn={true}
      />
    </div>
    <div class="button-container" bind:this={buttonElement}>
      {#if wallet.connecting}
        <BigButton text="Connecting..." disabled={true} onclick={() => {}} />
      {:else}
        <BigButton text="Connect wallet" onclick={wallet.handleClick} />
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

      .mascot-container {
        width: 400px;
        height: 400px;
        margin-bottom: 20px;
        pointer-events: none;
      }

      .button-container {
        width: 100%;
        height: 200px;
        margin-bottom: 20px;
      }
    }
  }
</style>
