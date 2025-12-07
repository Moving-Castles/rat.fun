<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateTripErrorOutput } from "./tripErrorOutput"
  import { BigButton } from "$lib/components/Shared"
  import { goto } from "$app/navigation"

  let terminalBoxElement = $state<HTMLDivElement>()
  let typer = $state<{ stop: () => void }>()
  let showModal = $state(false)

  const MODAL_DELAY = 600

  onMount(async () => {
    // Start the error terminal typer
    if (terminalBoxElement) {
      typer = terminalTyper(terminalBoxElement, generateTripErrorOutput())
    }

    // Show modal after delay
    setTimeout(() => {
      showModal = true
    }, MODAL_DELAY)
  })

  onDestroy(() => {
    if (typer?.stop) {
      typer.stop()
    }
  })

  const handleGoHome = () => {
    goto("/")
  }
</script>

<div class="error-screen">
  <div class="terminal-box" bind:this={terminalBoxElement}></div>

  {#if showModal}
    <div class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-box">
          <h1>Machine broke</h1>
          <p class="modal-message">Sorry for the inconvenience.</p>
          <p class="modal-message">Your rat is safe.</p>
          <p class="modal-message">Try doing it again.</p>

          <div class="modal-button">
            <BigButton text="Go back" onclick={handleGoHome} />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .error-screen {
    padding: 20px;
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: 100dvw;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    background: var(--background-light-transparent);
    user-select: none;

    @media (max-width: 800px) {
      padding: 10px;
    }

    .terminal-box {
      font-size: var(--font-size-normal);
      width: calc(100% - 30px);
      max-width: 800px;
      height: calc(100% - 40px);
      overflow-x: hidden;
      overflow-wrap: break-word;

      @media (max-width: 800px) {
        font-size: var(--font-size-small);
        max-width: 100dvw;
      }
    }
  }

  .modal-backdrop {
    background: var(--background-dark-transparent);
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overscroll-behavior: none;
    z-index: var(--z-modal);
    animation: fadeIn 0.3s ease-out;

    @media (max-width: 800px) {
      background: var(--background-dark-transparent);
    }
  }

  .modal-content {
    position: relative;
    z-index: 1;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 90dvh;
    animation: slideIn 0.3s ease-out;

    @media (max-width: 800px) {
      width: 100dvw;
      max-height: 100dvh;
      padding: 20px;
    }
  }

  .modal-box {
    width: 400px;
    max-width: 100%;
    display: flex;
    flex-flow: column nowrap;
    background-image: url("/images/texture-3.png");
    background-size: 200px;
    border: 1px solid var(--color-grey-mid);
    padding: 30px;
    gap: 20px;

    @media (max-width: 800px) {
      width: 100%;
      border: none;
      padding: 20px;
    }

    .modal-message {
      font-size: var(--font-size-normal);
      color: var(--color-white);
      text-align: center;
      margin: 0;
      font-family: var(--typewriter-font-stack);
      line-height: 1.5;
    }

    h1 {
      font-size: var(--font-size-large);
      color: var(--color-white);
      text-align: center;
      margin: 0;
      font-family: var(--typewriter-font-stack);
      line-height: 1.5;
    }

    .modal-button {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      margin-top: 10px;
      height: 100px;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
