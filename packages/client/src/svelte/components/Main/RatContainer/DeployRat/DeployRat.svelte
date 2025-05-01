<script lang="ts">
  import { createRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { generateRatName } from "./index"

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
    <div class="image-container">
      <img src="/images/rat.png" alt="Rat" />
    </div>
    <button class:disabled class:busy onclick={sendCreateRat}>
      <span class="button-text">Deploy new rat: {name} (Cost: $100)</span>
      {#if busy}
        <div class="spinner"><Spinner /></div>
      {/if}
    </button>
  {/if}
</div>

<style lang="scss">
  .main {
    text-align: center;
    padding-inline: 20px;
    color: var(--white);
    width: 100%;
  }

  .done {
    margin-top: 20px;
    text-align: left;
    padding: 20px;
    background-color: var(--color-grey-dark);
  }

  .image-container {
    margin-top: 20px;
    margin-bottom: 20px;
    height: 400px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  button {
    padding: 20px;
    width: 100%;
    background: var(--color-alert);
    margin-bottom: 20px;

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
      background: var(--color-alert);
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
