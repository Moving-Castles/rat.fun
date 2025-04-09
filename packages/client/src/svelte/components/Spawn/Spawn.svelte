<script lang="ts">
  import { onMount } from "svelte"
  import { spawn } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { UIState, UILocation } from "@modules/ui/stores"
  import { LOCATION, UI } from "@modules/ui/enums"
  import { getModalState } from "@components/Main/Modal/state.svelte"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  let { modal } = getModalState()

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
      UIState.set(UI.READY)
      UILocation.set(LOCATION.MAIN)
      modal.close()
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(() => {
    if ($player?.entityType === ENTITY_TYPE.PLAYER) {
      modal.close()
    }
    inputEl.focus()
  })
</script>

<div class="container">
  {#if !busy}
    <div class="main">
      <div class="content">
        <p>
          <strong>Welcome to Facility45</strong>
        </p>
        <p>Authorized personnel only beyond this point.</p>
      </div>

      <div class="form">
        <input
          type="text"
          placeholder="YOUR NAME"
          disabled={busy}
          bind:this={inputEl}
          bind:value={name}
          onkeydown={e => e.key === "Enter" && sendSpawn()}
        />
      </div>
      <button class:disabled={!name} class:busy onclick={sendSpawn}>
        SUBMIT
        {#if busy}
          <div class="spinner"><Spinner /></div>
        {/if}
      </button>
    </div>
  {:else}
    <div class="main">
      <p>Standby <strong>{name}</strong></p>
      <p>Connecting to <strong>Facility45</strong>....</p>
      <Spinner />
    </div>
  {/if}
</div>

<style lang="scss">
  .container {
    width: 100%;
    background: var(--corporate-background);
    font-family: var(--typewriter-font-stack);
    text-transform: none;
    height: 100%;
  }

  .main {
    font-size: 18px;
    color: var(--corporate-foreground);
    width: 100%;
    height: 100%;
    max-width: 90vw;
    padding: 40px;
  }

  .marker {
    background: var(--corporate-alert);
  }

  p {
    margin-bottom: 0.4em;
  }

  .content {
    padding-top: 1em;
    border-top: 1px dashed var(--corporate-foreground);
    padding-bottom: 1em;
    border-bottom: 1px dashed var(--corporate-foreground);
    margin-bottom: 1em;
  }

  input {
    height: 4em;
    width: 300px;
    font-size: 18px;
    padding: 10px;
    background: var(--color-grey-light);
    color: var(--black);
    border: none;
    margin-bottom: 0.5em;
    font-family: "Rock Salt", cursive;
    text-transform: uppercase;
    border-bottom: 1px dashed var(--corporate-foreground);
    outline: none;
  }

  button {
    font-family: var(--typewriter-font-stack);
    font-size: 18px;
    width: 300px;
    height: 4em;
    margin-bottom: 0.5em;

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
