<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let mascotElement = $state<HTMLDivElement | null>(null)
  let messageElement = $state<HTMLDivElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)

  const timeline = gsap.timeline()

  function handleRetry() {
    console.log("[Error] Retry button clicked")
    // Reset and start over
    spawnState.state.transitionTo(SPAWN_STATE.CONNECT_WALLET)
  }

  onMount(() => {
    console.log("[Error] Component mounted")

    if (!mascotElement || !messageElement || !buttonElement) {
      return
    }

    gsap.set([mascotElement, messageElement, buttonElement], { opacity: 0 })

    timeline
      .to(mascotElement, { opacity: 1, duration: 0.4 }, "0")
      .to(messageElement, { opacity: 1, duration: 0.4 }, "0.1")
      .to(buttonElement, { opacity: 1, duration: 0.3 }, "0.2")
  })
</script>

<div class="debug-badge">ERROR</div>
<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot />
    </div>

    <div class="message-container" bind:this={messageElement}>
      <p class="error-title">{UI_STRINGS.somethingWentWrong}</p>
      <p class="error-message">{UI_STRINGS.errorOccurred}</p>
    </div>

    <div class="button-container" bind:this={buttonElement}>
      <BigButton text={UI_STRINGS.startOver} onclick={handleRetry} />
    </div>
  </div>
</div>

<style lang="scss">
  .debug-badge {
    position: fixed;
    top: 50px;
    right: 10px;
    background: magenta;
    color: white;
    padding: 4px 8px;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    border-radius: 4px;
    display: none;
  }

  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: var(--spawn-inner-width);
      max-width: 90dvw;

      .mascot-container {
        width: var(--spawn-mascot-size);
        height: var(--spawn-mascot-size);
        margin-bottom: var(--spawn-mascot-margin-bottom);
        pointer-events: none;
      }

      .message-container {
        text-align: center;
        margin-bottom: 40px;

        .error-title {
          font-size: var(--font-size-xlarge);
          background: orangered;
          color: var(--background);
          padding: 20px;
          margin: 0 0 20px 0;
          font-weight: bold;
        }

        .error-message {
          font-size: var(--font-size-normal);
          background: var(--background);
          color: var(--foreground);
          padding: 20px;
          margin: 0;
          line-height: 1.5;
        }
      }

      .button-container {
        width: 100%;
        height: var(--spawn-button-height);
      }
    }
  }
</style>
