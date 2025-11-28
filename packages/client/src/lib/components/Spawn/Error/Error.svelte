<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { BigButton } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let messageElement = $state<HTMLDivElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)

  const timeline = gsap.timeline()

  function handleRetry() {
    console.log("[Error] Retry button clicked")
    // Reset and start over
    spawnState.state.transitionTo(SPAWN_STATE.WELCOME_SCREEN)
  }

  onMount(() => {
    console.log("[Error] Component mounted")

    if (!messageElement || !buttonElement) {
      return
    }

    // Set initial opacity to 0
    gsap.set([messageElement, buttonElement], {
      opacity: 0
    })

    // Staggered fade-in animations
    timeline
      .to(
        messageElement,
        {
          opacity: 1,
          duration: 0.4
        },
        "0"
      )
      .to(
        buttonElement,
        {
          opacity: 1,
          duration: 0.3
        },
        "0.1"
      )
  })
</script>

<div class="outer-container">
  <div class="inner-container">
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
      width: 500px;
      max-width: 90dvw;

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
        height: 200px;
      }
    }
  }
</style>
