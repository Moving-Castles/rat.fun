<script lang="ts">
  import { createRat, approve } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { gameConfig, playerERC20Balance } from "@modules/state/base/stores"
  import { generateRatName } from "./index"
  import { sendDeployRatMessage } from "@modules/off-chain-sync"
  import { walletNetwork } from "@modules/network"

  import VideoLoader from "@components/Main/Shared/VideoLoader/VideoLoader.svelte"

  let busy = $state(false)
  let done = $state(false)

  const name: string = generateRatName()

  async function sendCreateRat() {
    if (busy) return
    playSound("tcm", "blink")
    busy = true
    try {
      const approveAction = approve(
        $gameConfig.externalAddressesConfig.gamePoolAddress,
        $gameConfig.gameConfig.ratCreationCost
      )
      await waitForCompletion(approveAction)
      const createRatAction = createRat(name)
      await waitForCompletion(createRatAction)
    } catch (e) {
      console.error(e)
    } finally {
      done = true
      sendDeployRatMessage($walletNetwork)
    }
  }

  let disabled = $derived(
    !name ||
      ($playerERC20Balance ?? 0) <
        Number($gameConfig?.gameConfig?.ratCreationCost ?? 0)
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
      <button class:disabled onclick={sendCreateRat}>
        <span class="button-text">Deploy new rat</span>
        <span class="button-cost">
          (Cost: ${Number($gameConfig?.gameConfig?.ratCreationCost)})
        </span>
      </button>
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

  .done {
    text-align: left;
    padding: 20px;
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

    button {
      width: 100%;
      height: 100%;

      background: var(--color-alert-priority);
      border: none;
      border-top: var(--default-border-style);
      transition: transform 0.2s ease-in-out;

      .button-text {
        letter-spacing: -0.2em;
        font-size: var(--font-size-extra-large);
        font-family: var(--label-font-stack);
      }

      .button-cost {
        font-size: var(--font-size-normal);
      }

      &:hover {
        transform: scale(1.3);
      }

      &.disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: default;
      }

      &.busy {
        pointer-events: none;
        cursor: default;
        background: var(--color-grey-light);

        .spinner {
          display: block;
        }

        .button-text {
          display: none;
        }
      }
    }
  }
</style>
