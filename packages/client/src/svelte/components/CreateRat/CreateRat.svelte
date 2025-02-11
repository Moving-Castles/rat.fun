<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { createRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { rat, player } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"
  import Cage from "@components/Cage/Cage.svelte"
  import Main from "@components/World/Main.svelte"

  import Spinner from "@components/Elements/Spinner/Spinner.svelte"

  const dispatch = createEventDispatcher()

  const done = () => dispatch("done")

  let busy = false
  let name: string
  let inputEl: HTMLInputElement

  async function sendCreateRat() {
    playSound("tcm", "blink")
    busy = true
    const action = createRat(name)
    try {
      await waitForCompletion(action)
      done()
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(() => {
    // If player already has a living rat, continue
    if ($rat && !$rat.dead && $rat.entityType === ENTITY_TYPE.RAT) {
      done()
    }
  })
</script>

<div class="main">
  <div class="title">WELCOME {$player?.name ?? ""}</div>
  <div class="image-container">
    <Main>
      <Cage />
    </Main>
  </div>
  <div class="form">
    <input
      type="text"
      placeholder="RAT NAME"
      disabled={busy}
      bind:this={inputEl}
      bind:value={name}
      on:keydown={e => e.key === "Enter" && sendCreateRat()}
    />
  </div>
  <button class:disabled={!name} class:busy on:click={sendCreateRat}>
    <span class="button-text">CREATE A RAT</span>
    {#if busy}
      <div class="spinner"><Spinner /></div>
    {/if}
  </button>
</div>

<style lang="scss">
  .main {
    text-align: center;
    padding-inline: 20px;
    background: var(--color-grey-mid);
    color: var(--white);
    width: 50%;
  }

  .title {
    font-size: var(--font-size-large);
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .image-container {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  button {
    padding: 20px;
    font-size: var(--font-size-large);
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

  input {
    width: 100%;
    padding: 10px;
    font-size: var(--font-size-large);
    background: var(--color-grey-light);
    color: var(--black);
    border: none;
    margin-bottom: 20px;
    text-align: center;
    outline-color: var(--color-alert);
    font-family: var(--typewriter-stack);
    text-transform: uppercase;
  }
</style>
