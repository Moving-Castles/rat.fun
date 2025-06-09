<script lang="ts">
  import { createRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { gameConfig, player } from "@modules/state/base/stores"
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
    const action = createRat(name)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      done = true
      sendDeployRatMessage($walletNetwork)
    }
  }

  let disabled = $derived(
    !name ||
      ($player?.balance ?? 0) <
        Number($gameConfig?.gameConfig?.ratCreationCost ?? 0)
  )
</script>

{#if busy}
  <VideoLoader duration={5000} />
{:else}
  <div class="deploy-rat">
    <div class="image-container warning-mute-inverse">
      <img src="/images/rat.png" alt="Rat" />
    </div>
    <button class:disabled onclick={sendCreateRat}>
      <span class="button-text">Deploy new rat</span><br />
      <span>Cost: ${Number($gameConfig?.gameConfig?.ratCreationCost)}</span>
    </button>
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

  button {
    padding: 20px;
    width: 100%;
    height: 80px;
    background: var(--color-alert-priority);
    border: none;
    border-top: var(--default-border-style);

    &:hover {
      background: var(--color-alert);
      color: var(--foreground);
    }

    .spinner {
      position: relative;
      top: 2px;
      display: none;
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
</style>
