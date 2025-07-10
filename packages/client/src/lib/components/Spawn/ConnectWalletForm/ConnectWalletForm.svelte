<script lang="ts">
  import type { Hex } from "viem"
  import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"
  import EntryKit from "$lib/components/Spawn/EntryKit/EntryKit.svelte"

  import { WALLET_TYPE } from "$lib/mud/enums"

  import type { AccountKitConnectReturn } from "$lib/modules/entrykit/types"
  import { connect } from "$lib/modules/entrykit/connect"

  import { onMount } from "svelte"
  import gsap from "gsap"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"

  import { BigButton } from "$lib/components/Shared"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: (isSpawned: boolean) => void
  }>()

  let buttonText = $derived(
    walletType === WALLET_TYPE.ACCOUNTKIT ? "CONNECT WALLET" : "CONNECT BURNER"
  )
  let message = $derived(
    walletType === WALLET_TYPE.ACCOUNTKIT
      ? "Stop. You need an offical BASE(TM) WALLET TO ENTER."
      : "Stop. Connect your burner ID (wallet) to enter"
  )

  async function connectAccountKit() {
    let accountKitConnectReturn: AccountKitConnectReturn | null = null

    try {
      accountKitConnectReturn = await connect()
    } catch (e) {
      // This probably means the user closed the account kit modal
      console.log("Account kit error", e)
      return
    }

    const wallet = setupWalletNetwork(
      $publicNetwork,
      accountKitConnectReturn.appAccountClient
    ) as SetupWalletNetworkResult

    const isSpawned = initWalletNetwork(
      wallet,
      accountKitConnectReturn.userAddress as Hex,
      WALLET_TYPE.ACCOUNTKIT
    )

    onComplete(isSpawned)
  }

  async function connectBurner() {
    const wallet = setupBurnerWalletNetwork($publicNetwork)
    const isSpawned = initWalletNetwork(
      wallet,
      wallet.walletClient?.account.address,
      WALLET_TYPE.BURNER
    )
    onComplete(isSpawned)
  }

  let imageElement: HTMLImageElement | null = $state(null)
  let messageElement: HTMLParagraphElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  onMount(() => {
    if (!imageElement || !messageElement || !buttonElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    messageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"

    // Animate opacity to 1
    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    timeline.to(messageElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <img src="/images/bouncer2.png" alt="BASE(TM) ID" bind:this={imageElement} />
    <p bind:this={messageElement}>{message}</p>
    <div class="button" bind:this={buttonElement}>
      <EntryKit {onComplete} />
    </div>
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;

      img {
        height: 60dvh;
      }

      .button {
        width: 400px;
        height: 80px;
      }
    }
  }
</style>
