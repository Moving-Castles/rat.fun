<script lang="ts">
  import { onMount, onDestroy } from "svelte"

  import { page } from "$app/state"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"
  import { player, playerAddress, entities } from "$lib/modules/state/stores"

  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession, entryKitConnector } from "$lib/modules/entry-kit/stores"

  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/state/stores"

  import Introduction from "$lib/components/Spawn/Introduction/Introduction.svelte"
  import ConnectWalletForm from "$lib/components/Spawn/ConnectWalletForm/ConnectWalletForm.svelte"
  import SpawnForm from "$lib/components/Spawn/SpawnForm/SpawnForm.svelte"
  import TokenForm from "$lib/components/Spawn/TokenForm/TokenForm.svelte"
  import ApprovalForm from "$lib/components/Spawn/ApprovalForm/ApprovalForm.svelte"
  import HeroImage from "$lib/components/Spawn/HeroImage/HeroImage.svelte"
  import EntryKit from "$lib/components/Spawn/Entrykit/EntryKit.svelte"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  let currentState = $state<SPAWN_STATE>(SPAWN_STATE.NONE)
  let entryKitMounted = $state(false)
  let walletInitialized = $state(false)
  let userCompletedConnection = $state(false)

  // Check if we're already in a game and should skip spawn
  const shouldSkipSpawn = () => {
    return page.route.id === "/(rooms)/(game)/[roomId]" && !page.url.searchParams.has("spawn")
  }

  // Centralized state transition logic
  const transitionToNextState = () => {
    console.log("Transitioning state:", {
      currentState,
      walletInitialized,
      userCompletedConnection,
      player: $player,
      balance: $playerERC20Balance,
      allowance: $playerERC20Allowance
    })

    // If player exists and we should skip spawn, go directly to game
    if ($player && shouldSkipSpawn()) {
      spawned()
      return
    }

    // If player exists, check their token/allowance status
    if ($player) {
      if ($playerERC20Balance < 100) {
        currentState = SPAWN_STATE.TOKEN_FORM
      } else if ($playerERC20Allowance < 100) {
        currentState = SPAWN_STATE.APPROVAL_FORM
      } else {
        currentState = SPAWN_STATE.HERO_IMAGE
      }
      return
    }

    // If user has completed connection flow and wallet is ready, show spawn form
    if (userCompletedConnection && walletInitialized) {
      currentState = SPAWN_STATE.SPAWN_FORM
      return
    }

    // For EntryKit, wait for mounting and session
    if (walletType === WALLET_TYPE.ENTRYKIT) {
      if (entryKitMounted && $entryKitSession?.userAddress) {
        initializeEntryKitWallet()
      } else if (entryKitMounted) {
        currentState = SPAWN_STATE.INTRODUCTION
      }
      // Otherwise stay in NONE state until EntryKit is ready
      return
    }

    // For burner wallet, show introduction if wallet is set up
    if (walletType === WALLET_TYPE.BURNER && walletInitialized) {
      currentState = SPAWN_STATE.INTRODUCTION
    }
  }

  const initializeBurnerWallet = async () => {
    try {
      const wallet = setupBurnerWalletNetwork($publicNetwork)
      const isSpawned = initWalletNetwork(
        wallet,
        wallet.walletClient?.account.address,
        WALLET_TYPE.BURNER
      )

      walletInitialized = true

      // Check if already spawned and should skip
      if (isSpawned && shouldSkipSpawn()) {
        spawned()
      } else {
        transitionToNextState()
      }
    } catch (error) {
      console.error("Failed to initialize burner wallet:", error)
      currentState = SPAWN_STATE.INTRODUCTION
    }
  }

  const initializeEntryKitWallet = () => {
    if (!$entryKitSession?.userAddress || !$entryKitConnector) {
      console.log("EntryKit session not ready")
      return
    }

    try {
      const wallet = setupWalletNetwork($publicNetwork, $entryKitConnector)
      const isSpawned = initWalletNetwork(wallet, $entryKitSession.userAddress, walletType)

      walletInitialized = true
      userCompletedConnection = true // EntryKit connection is automatic

      if (isSpawned && shouldSkipSpawn()) {
        spawned()
      } else {
        transitionToNextState()
      }
    } catch (error) {
      console.error("Failed to initialize EntryKit wallet:", error)
      currentState = SPAWN_STATE.INTRODUCTION
    }
  }

  // Event handlers
  const onEntryKitMounted = () => {
    console.log("EntryKit mounted")
    entryKitMounted = true
    transitionToNextState()
  }

  const onEntryKitSessionReady = () => {
    console.log("EntryKit session ready")
    transitionToNextState()
  }

  const onIntroductionComplete = () => {
    currentState = SPAWN_STATE.CONNECT_WALLET
  }

  const onWalletConnectionComplete = () => {
    userCompletedConnection = true
    if (walletType === WALLET_TYPE.BURNER) {
      transitionToNextState()
    }
    // EntryKit connection is handled by session effects
  }

  const onSpawnComplete = () => {
    transitionToNextState()
  }

  const onTokenFormComplete = () => {
    transitionToNextState()
  }

  const onApprovalFormComplete = () => {
    transitionToNextState()
  }

  const onHeroImageComplete = () => {
    spawned()
  }

  // React to EntryKit session changes
  $effect(() => {
    if (walletType === WALLET_TYPE.ENTRYKIT && entryKitMounted && $entryKitSession?.userAddress) {
      onEntryKitSessionReady()
    }
  })

  // React to player state changes
  $effect(() => {
    if ($player && walletInitialized) {
      transitionToNextState()
    }
  })

  onMount(() => {
    console.log("Spawn component mounted with wallet type:", walletType)

    if (walletType === WALLET_TYPE.BURNER) {
      initializeBurnerWallet()
    } else if (walletType === WALLET_TYPE.ENTRYKIT) {
      // EntryKit initialization will happen when mounted + session ready
      currentState = SPAWN_STATE.NONE // Wait for EntryKit to mount
    } else {
      console.error("Unknown wallet type:", walletType)
      currentState = SPAWN_STATE.INTRODUCTION
    }
  })
</script>

<div class="container">
  <div class="content">
    {#if currentState === SPAWN_STATE.NONE}
      {#if walletType === WALLET_TYPE.ENTRYKIT}
        <EntryKit
          hidden={false}
          onMounted={onEntryKitMounted}
          onAccountConnected={onEntryKitSessionReady}
        />
      {/if}
      <!-- Show loading or wait state -->
    {:else if currentState === SPAWN_STATE.INTRODUCTION}
      <Introduction onComplete={onIntroductionComplete} />
    {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
      <ConnectWalletForm {walletType} onComplete={onWalletConnectionComplete} />
    {:else if currentState === SPAWN_STATE.SPAWN_FORM}
      <SpawnForm onComplete={onSpawnComplete} />
    {:else if currentState === SPAWN_STATE.TOKEN_FORM}
      <TokenForm onComplete={onTokenFormComplete} />
    {:else if currentState === SPAWN_STATE.APPROVAL_FORM}
      <ApprovalForm onComplete={onApprovalFormComplete} />
    {:else if currentState === SPAWN_STATE.HERO_IMAGE}
      <HeroImage onComplete={onHeroImageComplete} />
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    color: var(--foreground);
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-large);
    position: relative;
  }

  .content {
    position: relative;
    z-index: 1;
  }
</style>
