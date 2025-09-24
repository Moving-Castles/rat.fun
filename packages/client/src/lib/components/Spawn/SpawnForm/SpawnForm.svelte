<script lang="ts">
  import { sendSpawn } from "$lib/modules/action-manager/index.svelte"
  import gsap from "gsap"
  import { onMount } from "svelte"

  import { BigButton } from "$lib/components/Shared"
  import { player } from "$lib/modules/state/stores"
  import { typeHit } from "$lib/modules/sound/state.svelte"
  import { InputValidationError } from "$lib/modules/error-handling/errors"
  import { waitForPropertyChange } from "$lib/modules/state/utils"
  import SmallSpinner from "$lib/components/Shared/Loaders/SmallSpinner.svelte"

  const { onComplete = () => {} } = $props<{
    onComplete: (name: string) => void
  }>()

  let name = $state("")
  let busy = $state(false)

  let imageElement: HTMLImageElement | null = $state(null)
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
    if (!buttonElement || !textElement || !imageElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"
    textElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
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
      <div>Issuing member card</div>
      <SmallSpinner />
    {:else}
      <!-- <img class="image" src="/images/mascot2.png" alt="RAT.FUN" bind:this={imageElement} /> -->
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
          oninput={typeHit}
          onkeydown={e => e.key === "Enter" && submitForm()}
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
      width: 500px;

      img {
        height: 50dvh;
        @media (max-width: 900px) {
          width: 70dvw;
          height: auto;
        }
      }

      .form {
        display: flex;
        width: 100%;
        input {
          height: 100%;
          width: 300px;
          margin-right: 10px;
          font-size: var(--font-size-normal);
          padding: 10px;
          background: var(--white);
          color: black;
          border: none;
          margin-bottom: 0;
          font-family: monospace;
          text-transform: uppercase;
          border-bottom: var(--default-border-style);
          outline: none;

          &::placeholder {
            color: var(--color-grey-dark);
          }
        }

        .button-container {
          width: 100%;
          height: 80px;
        }
      }
    }
  }
</style>
