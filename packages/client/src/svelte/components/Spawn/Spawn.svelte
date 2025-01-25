<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { spawn } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  import Spinner from "@components/Spinner/Spinner.svelte"

  const dispatch = createEventDispatcher()

  const done = () => dispatch("done")

  let busy = false
  let name: string
  let inputEl: HTMLInputElement

  async function sendSpawn() {
    if (!name) return
    playSound("tcm", "blink")
    busy = true
    const action = spawn(name)
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
    if ($player?.entityType === ENTITY_TYPE.PLAYER) {
      done()
    }
    inputEl.focus()
  })
</script>

<div class="main">
  <div class="title">RESEARCH FACILITY</div>
  <div class="form">
    <input
      type="text"
      placeholder="YOUR NAME"
      disabled={busy}
      bind:this={inputEl}
      bind:value={name}
      on:keydown={e => e.key === "Enter" && sendSpawn()}
    />
  </div>
  <button class:disabled={!name} class:busy on:click={sendSpawn}>
    <span class="button-text">ENTER</span>
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
