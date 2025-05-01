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
  <div class="main">
    {#if !busy}
      <!-- INTRO TEXT -->
      <div class="content">
        <p class="header">
          <span class="inverted">Welcome to Rat Rooms Playtest #2</span>
        </p>
        <p class="small">
          Rat Rooms is a two sided market between rats and room creators. Each
          room has a balance: it grows when rats lose value, and shrinks when
          rats win.
        </p>
        <ol class="small">
          <li>Study the rooms</li>
          <li>Send in your rat</li>
          <li>Traits, tokens, and items are useful in rooms</li>
          <li>Liquidate to cash out</li>
          <li>Create your own rooms</li>
        </ol>
        <p class="small">
          Your goal is to have as many tokens as possible within 30 minutes.
        </p>
      </div>

      <!-- FORM -->
      <div class="form">
        <p>Sign with operator name to proceed.</p>
        <!-- INPUT -->
        <input
          type="text"
          placeholder="YOUR NAME"
          disabled={busy}
          bind:this={inputEl}
          bind:value={name}
          onkeydown={e => e.key === "Enter" && sendSpawn()}
        />
        <button class:disabled={!name} class:busy onclick={sendSpawn}>
          SIGN
          {#if busy}
            <div class="spinner"><Spinner /></div>
          {/if}
        </button>
      </div>
    {:else}
      <div class="main">
        <p>Standby <strong>{name}</strong></p>
        <p>Connecting to <strong>Rat Rooms</strong>....</p>
        <Spinner />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    width: 600px;
    max-width: 80vw;
    background: var(--corporate-background);
    font-family: var(--typewriter-font-stack);
    text-transform: none;
    height: auto;
  }

  .main {
    color: var(--corporate-foreground);
    width: 100%;
    height: 100%;
    max-width: calc(var(--game-window-width) * 0.9);
    padding: 10px 30px;
    padding-bottom: 30px;
  }

  p {
    margin-bottom: 1em;
  }

  .small {
    font-size: var(--font-size-normal);
  }

  .inverted {
    background: black;
    color: white;
    padding: 5px;
  }

  .header {
    margin-bottom: 2em;
    display: block;
  }

  .content {
    padding-top: 1em;
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
    background: var(--color-alert);

    .spinner {
      position: relative;
      top: 2px;
      display: none;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
      background: var(--color-grey-light);
    }

    &.busy {
      background: var(--color-alert);
      pointer-events: none;
      cursor: default;
      background: var(--color-grey-light);

      .spinner {
        display: block;
      }
    }
  }
</style>
