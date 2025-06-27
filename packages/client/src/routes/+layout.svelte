<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from "./$types"

  import { Modal } from "$lib/components/Main/Modal/state.svelte"
  import { onMount } from "svelte"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork, walletNetwork } from "$lib/modules/network"
  import { initSound, playSound } from "$lib/modules/sound"
  import { UIState, UILocation } from "$lib/modules/ui/stores"
  import { UI, LOCATION } from "$lib/modules/ui/enums"
  import { initOffChainSync } from "$lib/modules/off-chain-sync"
  import { playerId } from "$lib/modules/state/base/stores"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { EMPTY_CONNECTION } from "$lib/modules/utils/constants"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { gameConfig } from "$lib/modules/state/base/stores"
  import { mountAccountKit } from "$lib/modules/account-kit/mount"

  import WalletInfo from "$lib/components/Debug/WalletInfo.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Spawn from "$lib/components/Spawn/Spawn.svelte"
  import PageTransitions from "$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte"

  let { children, data }: LayoutProps = $props()

  const { environment, walletType } = data

  const config = [
    {
      from: "/(rooms)/rat/[roomId]",
      to: "/(rooms)/rat/[roomId]/enter",
      out: {
        transition: "wipe",
        params: {
          duration: 1000,
          direction: "in"
        }
      },
      in: {
        transition: "fade",
        params: {
          duration: 1000,
          delay: 200
        }
      }
    },
    {
      from: "/(rooms)/rat/[roomId]/enter",
      to: "*",
      out: {
        transition: "fade",
        params: {
          duration: 400,
          delay: 200
        }
      },
      in: {
        transition: "wipe",
        params: {
          duration: 1000,
          direction: "out"
        }
      }
    }
  ]

  $effect(() => {
    console.log("$walletNetwork", $walletNetwork)
    console.log("$gameConfig", $gameConfig)
  })

  const environmentLoaded = async () => {
    console.log($publicNetwork.worldAddress)
    // Get content from CMS
    await initStaticContent($publicNetwork.worldAddress)
    UIState.set(UI.SPAWNING)
  }

  const playerSpawned = () => {
    UIState.set(UI.READY)
    UILocation.set(LOCATION.MAIN)
  }

  // Init of chain sync when player is ready
  $effect(() => {
    if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
      initOffChainSync(data.environment, $playerId)
    }
  })

  onMount(async () => {
    if (data.walletType === WALLET_TYPE.ACCOUNTKIT) {
      // = = = = = = = = = = = =
      // Mount account kit
      // = = = = = = = = = = = =
      mountAccountKit(data.environment)
    }

    // Remove preloader
    document.querySelector(".preloader")?.remove()

    // Preload sounds
    initSound()
    // Play background sound
    playSound("tcm", "podBg", true, true)
  })
</script>

<div class="bg">
  <div class="context-main">
    {#if $UIState === UI.LOADING}
      <main>
        <Loading {environment} loaded={environmentLoaded} />
      </main>
    {:else if $UIState === UI.SPAWNING}
      <main>
        <Spawn spawned={playerSpawned} {walletType} />
      </main>
    {:else if $UIState === UI.READY}
      <div class="layer-game">
        <PageTransitions {config}>
          {@render children?.()}
        </PageTransitions>
      </div>
    {/if}
  </div>
</div>

<Modal />

<WalletInfo {walletType} {environment} />

<style lang="scss">
  .context-main {
    width: var(--game-window-width);
    height: var(--game-window-height);
    overflow: hidden;
    position: fixed;
    z-index: var(--z-base);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--background);
  }

  main {
    width: var(--game-window-width);
    height: var(--game-window-height);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-background);
    background: var(--background);
    background-image: url("/images/textures/2.jpg");
    background-size: 300px;
  }
</style>
