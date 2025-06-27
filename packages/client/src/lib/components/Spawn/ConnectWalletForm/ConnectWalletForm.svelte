<script lang="ts">
  import type { Hex } from "viem"
  import type { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"

  import { WALLET_TYPE } from "$lib/mud/enums"

  import type { AccountKitConnectReturn } from "$lib/modules/account-kit/types"
  import { connect } from "$lib/modules/account-kit/connect"

  import { gameConfig, playerERC20Allowance } from "$lib/modules/state/base/stores"
  import { approveMax } from "$lib/modules/action"
  import { waitForCompletion } from "$lib/modules/action/actionSequencer/utils"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"

  import { BigButton } from "$lib/components/Shared"

  const { onComplete = () => {} } = $props<{
    onComplete: (isSpawned: boolean) => void
  }>()

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

    if ($playerERC20Allowance < 100) {
      try {
        const approveAction = approveMax($gameConfig.externalAddressesConfig.gamePoolAddress)
        await waitForCompletion(approveAction)
      } catch (e) {
        console.error(e)
      }
    }

    onComplete(isSpawned)
  }
</script>

<div class="container">
  <div class="main">
    <div class="content">
      <div class="form">
        <p>Connect your wallet</p>
        <BigButton text="CONNECT" onclick={connectAccountKit} />
      </div>
    </div>
  </div>
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
</style>
