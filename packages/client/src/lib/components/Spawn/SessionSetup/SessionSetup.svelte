<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getEntryKit } from "$lib/modules/entry-kit"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  const { onComplete = () => {} } = $props<{
    onComplete: () => void
  }>()

  let buttonElement: HTMLDivElement | null = $state(null)
  let settingUp = $state(false)
  let error = $state<string | null>(null)

  const timeline = gsap.timeline()

  async function handleSetupSession() {
    try {
      settingUp = true
      error = null

      const entrykit = getEntryKit()
      await entrykit.setupSession()

      onComplete()
    } catch (err) {
      error = err instanceof Error ? err.message : "Session setup failed"
    } finally {
      settingUp = false
    }
  }

  onMount(() => {
    if (!buttonElement) {
      return
    }

    buttonElement.style.opacity = "0"

    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <div class="text-container">
      <h2>Session Setup</h2>
      <p>Create a secure session to interact with the game without signing every transaction.</p>
      {#if error}
        <p class="error">{error}</p>
      {/if}
    </div>

    <div class="button-container" bind:this={buttonElement}>
      {#if settingUp}
        <BigButton text="Setting up..." disabled={true} onclick={() => {}} />
      {:else}
        <BigButton text="Setup session" onclick={handleSetupSession} />
      {/if}
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

      .text-container {
        text-align: center;
        margin-bottom: 40px;
        color: var(--foreground);

        h2 {
          font-size: var(--font-size-xlarge);
          margin: 0 0 20px 0;
          font-family: var(--special-font-stack);
        }

        p {
          font-size: var(--font-size-normal);
          margin: 0 0 10px 0;
          line-height: 1.5;
        }

        .error {
          color: #ff4444;
          font-weight: bold;
          margin-top: 20px;
        }
      }

      .button-container {
        width: 100%;
        height: 200px;
      }
    }
  }
</style>
