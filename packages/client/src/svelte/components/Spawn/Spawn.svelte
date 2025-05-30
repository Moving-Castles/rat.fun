<script lang="ts">
  import { onMount } from "svelte"
  import { spawn } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  import VideoLoader from "@components/Main/Shared/VideoLoader/VideoLoader.svelte"

  const { spawned = () => {} } = $props<{
    spawned?: () => void
  }>()

  let busy = $state(false)
  let name = $state("")
  let inputEl = $state<HTMLInputElement | null>(null)

  async function sendSpawn() {
    if (!name) return
    playSound("tcm", "blink")
    busy = true
    const action = spawn(name)
    try {
      await waitForCompletion(action)
      spawned()
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(() => {
    if ($player?.entityType === ENTITY_TYPE.PLAYER) {
      spawned()
    }
    if (inputEl) {
      inputEl.focus()
    }
  })
</script>

<div class="container">
  {#if busy}
    <VideoLoader />
  {:else}
    <div class="main">
      <!-- INTRO TEXT -->
      <div class="content">
        <p class="header">
          <span class="inverted">Welcome to Rat Rooms Playtest #4</span>
        </p>
        <p class="small">
          You are an Operator working for the Firm. Your objective is to regain
          access to the underground floors of Facility F which has gone rogue.
          Use a remote controlled Rat to enter the facility by sending it down
          the (rat-sized) elevator to explore its many rooms, collecting items,
          traits and currency on your rat.
        </p>
        <ol class="small">
          <li>Study the rooms</li>
          <li>Send in your rat</li>
          <li>Traits, tokens, and items are useful in rooms</li>
          <li>Liquidate your rat to cash out</li>
          <li>Create your own rooms</li>
        </ol>
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
        <button class:disabled={!name} onclick={sendSpawn}>SIGN</button>
      </div>
    </div>
  {/if}
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

  .inverted {
    background: var(--color-alert-priority);
    color: var(--background);
    padding: 5px;
  }

  .header {
    margin-bottom: 2em;
    display: block;
  }

  .content {
    padding-top: 1em;
    padding-bottom: 1em;
    border-bottom: 1px dashed var(--foreground);
    margin-bottom: 1em;
  }

  input {
    height: 4em;
    width: 300px;
    font-size: 18px;
    padding: 10px;
    background: var(--color-alert);
    color: var(--background);
    border: none;
    margin-bottom: 0.5em;
    font-family: "Rock Salt", cursive;
    text-transform: uppercase;
    border-bottom: var(--default-border-style);
    outline: none;

    &::placeholder {
      color: var(--color-grey-dark);
    }
  }

  button {
    font-family: var(--typewriter-font-stack);
    font-size: 18px;
    width: 300px;
    height: 4em;
    background: var(--color-alert-priority);
    outline: none;
    border: var(--default-border-style);

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
