<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { spawn } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { player } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

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

<div class="container">
  {#if !busy}
    <div class="main">
      <div class="content">
        <p>
          <strong>Hello</strong>
          <span class="marker">[REPLACE WITH DESPERATE LOSER’S NAME]</span>,
        </p>

        <p>
          Hope this ad-free <span class="rainbow-text">NevroCast™</span> finds you
          well.
        </p>

        <p>We have a <strong>mission</strong> for you.</p>

        <p>
          An <strong>Operator</strong> position in our Rouge Annihilation Team has
          opened up.
        </p>

        <p>
          Psychological and financial analysis indicates that you are a <strong
            >perfect candidate</strong
          >.
        </p>

        <p>The <strong>situation</strong> is:</p>
        <p>
          <strong>We have lost contact with Facility45</strong>, one of our Rat
          Research Facilities.
        </p>
        <p>
          Signal intelligence suggests that the <strong
            >Supervisor System has "gone rouge"</strong
          >.
        </p>

        <p>
          We need you to <strong>infiltrate the facility</strong> and reestablish
          Total Corporate Control.
        </p>
        <p>
          For this purpose you will be <span class="rainbow-text"
            >NevroLink™</span
          >ed to a <strong>genetically enhanced rat</strong>.
        </p>
        <p>To accept the mission, <strong>sign below</strong>.</p>
        <p>Have a <strong>beautiful day</strong>!</p>
        <p class="signature">
          <span class="marker">[REDACTED]</span>
          <span class="marker">[REDACTED]</span><br />
          CEO of Anti-Insurgency Operations<br />
          Rouge Annihilation Team<br />
          <span class="marker">[REDACTED]</span> Corporation
        </p>
      </div>

      <div class="form">
        <input
          type="text"
          placeholder="SIGN HERE"
          disabled={busy}
          bind:this={inputEl}
          bind:value={name}
          onkeydown={e => e.key === "Enter" && sendSpawn()}
        />
      </div>
      <button class:disabled={!name} class:busy onclick={sendSpawn}>
        AGREE TO EVERYTHING
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
    width: 100vw;
    height: 100vh;
    background: var(--corporate-background);
    font-family: var(--corporate-font-stack);
    text-transform: none;
  }

  .main {
    font-size: 18px;
    color: var(--corporate-foreground);
    width: 80ch;
    max-width: 90vw;
    padding: 20px;
  }

  .marker {
    background: var(--corporate-alert);
  }

  p {
    margin-bottom: 0.4em;
  }

  .rainbow-text {
    background-image: linear-gradient(
      90deg,
      red,
      rgb(255, 98, 0),
      yellow,
      rgb(0, 255, 0),
      cyan,
      rgb(148, 207, 253),
      rgb(255, 178, 255),
      red
    );
    background-size: 400% 100%;
    animation: rainbowAnimation 4s linear infinite alternate;
  }

  @keyframes rainbowAnimation {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 100% 50%;
    }
  }

  .content {
    padding-top: 1em;
    border-top: 1px dashed var(--corporate-foreground);
    padding-bottom: 1em;
    border-bottom: 1px dashed var(--corporate-foreground);
    margin-bottom: 1em;
  }

  .signature {
    font-size: 14px;
    margin-top: 1em;
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
    font-family: var(--corporate-font-stack);
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
