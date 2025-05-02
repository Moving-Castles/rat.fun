<script lang="ts">
  import { createRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { generateRatName } from "./index"
  import { sendDeployRatMessage } from "@modules/off-chain-sync"
  import { walletNetwork } from "@modules/network"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

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

  let disabled = $derived(!name || ($player?.balance ?? 0) < 250)
</script>

<div class="main">
  {#if done}
    <div class="done">
      <span>Rat deployed. Stand by...</span>
    </div>
  {:else}
    <div class="image-container warning-mute-inverse">
      <img src="/images/rat.png" alt="Rat" />
      <small>
        {name}
      </small>
    </div>
    <button class:disabled class:busy onclick={sendCreateRat}>
      {#if busy}
        <div class="spinner"><Spinner /></div>
      {:else}
        <span class="button-text">Deploy new rat</span><br />
        <span>Cost: $100</span>
      {/if}
    </button>
  {/if}
</div>

<style lang="scss">
  .main {
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
    gap: 20px;

    img {
      width: 100%;
      height: 300px;
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
