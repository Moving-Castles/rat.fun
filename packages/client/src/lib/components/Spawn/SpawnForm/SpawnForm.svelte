<script lang="ts">
  import { sendSpawn } from "$lib/modules/action-manager/index.svelte"
  import gsap from "gsap"
  import { onMount } from "svelte"

  import { BigButton } from "$lib/components/Shared"
  import { player } from "$lib/modules/state/stores"
  import { typeHit } from "$lib/modules/sound"
  import { InputValidationError } from "$lib/modules/error-handling/errors"
  import { waitForPropertyChange } from "$lib/modules/state/utils"
  import SmallSpinner from "$lib/components/Shared/Loaders/SmallSpinner.svelte"

  const { onComplete = () => {} } = $props<{
    onComplete: (name: string) => void
  }>()

  let name = $state("")
  let busy = $state(false)

  let buttonElement: HTMLDivElement | null = $state(null)
  let textElement: HTMLDivElement | null = $state(null)
  const timeline = gsap.timeline()

  async function submitForm() {
    busy = true
    try {
      // Validate name is not empty
      if (!name || name.trim() === "") {
        throw new InputValidationError("Name cannot be empty", "name", name)
      }

      // Additional name validation (optional - can add more rules as needed)
      if (name.length > 50) {
        throw new InputValidationError("Name is too long (maximum 50 characters)", "name", name)
      }

      await sendSpawn(name)
      await waitForPropertyChange(player, "name", undefined, 10000)
      onComplete(name)
    } catch (error) {
      console.error(error)
      if (error instanceof InputValidationError) {
        // In a real UI, you might want to show this error to the user
        // For now, validation errors are handled silently
      } else {
        throw error // Re-throw non-validation errors
      }
    }
  }

  onMount(() => {
    if (!buttonElement || !textElement) {
      return
    }

    // Set initial opacity to 0
    buttonElement.style.opacity = "0"
    textElement.style.opacity = "0"

    timeline.to(textElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if busy}
      <div class="loader">Issuing member card <SmallSpinner /></div>
    {:else}
      <!-- INTRO TEXT -->
      <div class="text" bind:this={textElement}>
        <p>{$player?.name}ID checks out. You can enter. But we need your name to proceed.</p>
      </div>

      <!-- FORM -->
      <div class="form" bind:this={buttonElement}>
        <!-- INPUT -->
        <input
          type="text"
          placeholder="YOUR NAME"
          bind:value={name}
          onkeydown={e => {
            typeHit()
            if (e.key === "Enter") {
              submitForm()
            }
          }}
        />
        <div class="button-container">
          <BigButton text="SIGN" onclick={submitForm} disabled={!name} />
        </div>
      </div>
    {/if}
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
      width: 800px;
      max-width: 90dvw;

      p {
        font-size: var(--font-size-large);
        background: var(--background);
        color: var(--foreground);
        padding: 10px;
      }

      .form {
        display: flex;
        width: 100%;

        @media (max-width: 700px) {
          flex-wrap: wrap;
        }

        input {
          height: 100%;
          width: 300px;
          margin-right: 10px;
          font-size: var(--font-size-large);
          padding: 10px;
          background: var(--white);
          color: black;
          border: none;
          margin-bottom: 0;
          font-family: var(--special-font-stack);
          text-transform: uppercase;
          border-bottom: var(--default-border-style);
          outline: none;

          @media (max-width: 700px) {
            width: 100%;
            height: 100px;
            margin-bottom: 20px;
          }

          &::placeholder {
            color: var(--color-grey-light);
          }
        }

        .button-container {
          width: 100%;
          height: 100px;
        }
      }

      .loader {
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        background: var(--background);
        color: var(--foreground);
        padding: 10px;
      }
    }
  }
</style>
