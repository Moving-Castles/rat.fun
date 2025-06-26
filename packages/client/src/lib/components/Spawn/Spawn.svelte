<script lang="ts">
  import { maxUint256, type Hex } from "viem"
  import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"

  import { WALLET_TYPE } from "$lib/mud/enums"
  import { SPAWN_STATE } from "$lib/modules/ui/enums"

  import type { AccountKitConnectReturn } from "$lib/modules/account-kit/types"
  import { connect } from "$lib/modules/account-kit/connect"
  import { store as accountKitStore } from "@latticexyz/account-kit/bundle"

  import { onMount } from "svelte"
  import { gameConfig, playerERC20Allowance } from "$lib/modules/state/base/stores"
  import { approveMax, spawn } from "$lib/modules/action"
  import { waitForCompletion } from "$lib/modules/action/actionSequencer/utils"
  import { playSound } from "$lib/modules/sound"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"

  import Slides from "$lib/components/Main/Shared/Slides/Slides.svelte"
  import VideoLoader from "$lib/components/Main/Shared/Loaders/VideoLoader.svelte"
  import BigButton from "$lib/components/Main/Shared/Buttons/BigButton.svelte"

  const { walletType, spawned = () => {} } = $props<{
    walletType: WALLET_TYPE
    spawned: () => void
  }>()

  let currentState = $state<SPAWN_STATE>(SPAWN_STATE.INTRODUCTION)
  let name = $state("")

  async function sendSpawn() {
    if (!name) {
      return
    }

    playSound("tcm", "blink")
    currentState = SPAWN_STATE.BUSY

    try {
      const spawnAction = spawn(name)
      await waitForCompletion(spawnAction)
      spawned()
    } catch (e) {
      console.error(e)
      currentState = SPAWN_STATE.SHOW_FORM
    }
  }

  async function connectAccountKit() {
    let accountKitConnectReturn: AccountKitConnectReturn | null = null

    while (!accountKitConnectReturn) {
      try {
        accountKitConnectReturn = await connect()
      } catch (e) {
        console.log("Account kit error", e)
      }
    }

    const wallet = setupWalletNetwork(
      $publicNetwork,
      accountKitConnectReturn.appAccountClient
    ) as SetupWalletNetworkResult

    // Session wallet address => wallet.walletClient.account?.address
    console.log("wallet.walletClient.account?.address", wallet.walletClient.account.address)
    // Main user address => accountKitStoreState.userAddress
    console.log("accountKitConnectReturn.userAddress", accountKitConnectReturn.userAddress)

    const isSpawned = initWalletNetwork(
      wallet,
      accountKitConnectReturn.userAddress as Hex,
      WALLET_TYPE.ACCOUNTKIT
    )

    if ($playerERC20Allowance < 100) {
      try {
        const approveAction = approveMax($gameConfig.externalAddressesConfig.gamePoolAddress)
        await waitForCompletion(approveAction)
      } catch (e) {
        console.error(e)
      }
    }

    if (isSpawned) {
      // Connected and spawned - go to next step
      spawned()
    } else {
      // Connected but not spawned - show form
      currentState = SPAWN_STATE.SHOW_FORM
    }
  }

  async function connectBurner() {
    const wallet = setupBurnerWalletNetwork($publicNetwork)
    const isSpawned = initWalletNetwork(
      wallet,
      wallet.walletClient?.account.address,
      WALLET_TYPE.BURNER
    )

    // Check if player is already spawned
    if (isSpawned) {
      // Connected and spawned - go to next step
      spawned()
    } else {
      // Connected but not spawned - show form
      currentState = SPAWN_STATE.SHOW_FORM
    }
  }

  onMount(() => {
    if (walletType == WALLET_TYPE.ACCOUNTKIT) {
      /* We get the account kit store state
       * If appAccountClient and userAddress are set the user is connected
       * We set up the wallet network using the appAccountClient
       * and set playerAddress to the user address
       */
      const accountKitStoreState = accountKitStore.getState()
      if (accountKitStoreState.appAccountClient && accountKitStoreState.userAddress) {
        const wallet = setupWalletNetwork(
          $publicNetwork,
          accountKitStoreState.appAccountClient
        ) as SetupWalletNetworkResult

        // Session wallet address => wallet.walletClient.account?.address
        console.log("wallet.walletClient.account?.address", wallet.walletClient.account?.address)
        // Main user address => accountKitStoreState.userAddress
        console.log("accountKitStoreState.userAddress", accountKitStoreState.userAddress)

        const isSpawned = initWalletNetwork(wallet, accountKitStoreState.userAddress, walletType)

        if (isSpawned) {
          // Connected and spawned - go to next step
          spawned()
        } else {
          // Connected but not spawned - show form
          currentState = SPAWN_STATE.SHOW_FORM
        }
      } else {
        // Wallet not connected - show connect wallet state
        currentState = SPAWN_STATE.CONNECT_WALLET
      }
    } else {
      // For burner wallet, connect immediately
      connectBurner()
    }
  })
</script>

<div class="container">
  {#if currentState === SPAWN_STATE.INTRODUCTION}
    <Slides onComplete={() => (currentState = SPAWN_STATE.CONNECT_WALLET)} />
  {:else if currentState === SPAWN_STATE.CONNECT_WALLET}
    <div class="main">
      <div class="content">
        <div class="form">
          <p>Connect your wallet</p>
          <BigButton text="CONNECT" onclick={connectAccountKit} />
        </div>
      </div>
    </div>
  {:else if currentState === SPAWN_STATE.SHOW_FORM}
    <div class="main">
      <!-- INTRO TEXT -->
      <div class="content">
        <p class="header">
          <span class="inverted">Welcome to RAT.FUN</span>
        </p>
        <ol class="small">
          <li>Study the rooms</li>
          <li>Send in your rat</li>
          <li>Traits, tokens, and items are useful in rooms</li>
          <li>Liquidate your rat to cash out</li>
          <li>Create your own rooms</li>
        </ol>
      </div>

      <!-- FORM -->
      <div class="form">
        <p>Sign with operator name to proceed.</p>
        <!-- INPUT -->
        <input
          type="text"
          placeholder="YOUR NAME"
          bind:value={name}
          onkeydown={e => e.key === "Enter" && sendSpawn()}
        />
        <BigButton text="SIGN" onclick={sendSpawn} disabled={!name} />
      </div>
    </div>
  {:else if currentState === SPAWN_STATE.BUSY}
    <VideoLoader duration={6000} />
  {/if}
</div>

<style lang="scss">
  .container {
    width: 100vw;
    height: 100vh;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--special-font-stack);
    text-transform: none;
    font-size: var(--font-size-large);
  }

  .main {
    width: 100%;
    height: 100%;
    max-width: calc(var(--game-window-width) * 0.9);
    padding: 10px 30px;
    padding-bottom: 30px;
    max-width: 60ch;
  }

  p {
    margin-bottom: 1em;
  }

  .inverted {
    background: var(--color-alert-priority);
    color: var(--background);
    padding: 5px;
  }

  .header {
    margin-bottom: 2em;
    display: block;
  }

  .content {
    padding-top: 1em;
    padding-bottom: 1em;
    border-bottom: 1px dashed var(--foreground);
    margin-bottom: 1em;
  }

  input {
    height: 4em;
    width: 300px;
    font-size: 18px;
    padding: 10px;
    background: var(--color-alert);
    color: var(--background);
    border: none;
    margin-bottom: 0.5em;
    font-family: "Rock Salt", cursive;
    text-transform: uppercase;
    border-bottom: var(--default-border-style);
    outline: none;

    &::placeholder {
      color: var(--color-grey-dark);
    }
  }
</style>
