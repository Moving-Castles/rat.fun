<script lang="ts">
  import { createRat, approve } from "$lib/modules/action"
  import { waitForCompletion } from "$lib/modules/action/actionSequencer/utils"
  import { playSound } from "$lib/modules/sound"
  import {
    gameConfig,
    playerERC20Allowance,
    playerERC20Balance
  } from "$lib/modules/state/base/stores"
  import { generateRatName } from "./index"
  import { sendDeployRatMessage } from "$lib/modules/off-chain-sync"
  import { VideoLoader, BigButton } from "$lib/components/Shared"

  let busy = $state(false)

  const name: string = generateRatName()

  async function sendCreateRat() {
    if (busy) return
    playSound("tcm", "blink")
    busy = true
    try {
      if ($playerERC20Allowance < $gameConfig.gameConfig.ratCreationCost) {
        const approveAction = approve(
          $gameConfig.externalAddressesConfig.gamePoolAddress,
          $gameConfig.gameConfig.ratCreationCost
        )
        await waitForCompletion(approveAction)
      }
      const createRatAction = createRat(name)
      await waitForCompletion(createRatAction)
    } catch (e) {
      console.error(e)
      busy = false
    } finally {
      sendDeployRatMessage()
    }
  }

  let disabled = $derived(
    !name || ($playerERC20Balance ?? 0) < Number($gameConfig?.gameConfig?.ratCreationCost ?? 0)
  )
</script>

{#if busy}
  <VideoLoader duration={10000} />
{:else}
  <div class="deploy-rat">
    <div class="image-container warning-mute-inverse">
      <img src="/images/rat.png" alt="Rat" />
    </div>
    <div class="button-container">
      <BigButton
        text="Deploy new rat"
        cost={Number($gameConfig?.gameConfig?.ratCreationCost)}
        {disabled}
        onclick={sendCreateRat}
      />
    </div>
  </div>
{/if}

<style lang="scss">
  .deploy-rat {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr 80px;
  }

  .image-container {
    display: flex;
    flex-flow: column nowrap;
    height: 360px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      mix-blend-mode: screen;
    }
  }

  .button-container {
    overflow: hidden;
    width: 100%;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
