<script lang="ts">
  import { onMount } from "svelte"
  import { sendSpawn } from "$lib/modules/action-manager/index.svelte"
  import gsap from "gsap"

  import { player } from "$lib/modules/state/stores"
  import { typeHit } from "$lib/modules/sound"
  import { InputValidationError } from "$lib/modules/error-handling/errors"
  import { waitForPropertyChangeFrom } from "$lib/modules/state/utils"
  import { isSessionReady, sessionClient } from "$lib/modules/entry-kit"

  import { BigButton, Mascot, SmallSpinner } from "$lib/components/Shared"

  const { onComplete = () => {} } = $props<{
    onComplete: (name: string) => void
  }>()

  let name = $state("")
  let busy = $state(false)

  let mascotElement: HTMLDivElement | null = $state(null)
  // let textElement: HTMLDivElement | null = $state(null)
  let inputElement: HTMLInputElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  async function submitForm() {
    // Check if session is ready before allowing spawn
    if (!$sessionClient || !$isSessionReady) {
      console.warn("Session not ready yet, cannot spawn")
      return
    }

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

      console.log("Spawning with session:", $sessionClient.account.address)
      await sendSpawn(name)
      await waitForPropertyChangeFrom(player, "name", undefined, 10000)
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
    if (!mascotElement || !inputElement || !buttonElement) {
      return
    }

    // Set initial opacity to 0
    gsap.set([mascotElement, inputElement, buttonElement], {
      opacity: 0
    })

    // Staggered fade-in animations
    timeline
      .to(
        mascotElement,
        {
          opacity: 1,
          duration: 0.4
        },
        "0"
      )
      // .to(
      //   textElement,
      //   {
      //     opacity: 1,
      //     duration: 0.3
      //   },
      //   "0.1"
      // )
      .to(
        inputElement,
        {
          opacity: 1,
          duration: 0.3
        },
        "0.2"
      )
      .to(
        buttonElement,
        {
          opacity: 1,
          duration: 0.3
        },
        "0.3"
      )

    timeline.call(() => {
      if (inputElement) {
        inputElement.focus()
      }
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if busy}
      <div class="loader">Issuing member card <SmallSpinner soundOn /></div>
    {:else}
      <!-- MASCOT -->
      <div class="mascot-container" bind:this={mascotElement}>
        <Mascot entranceOn={true} bigDanceOn={true} />
      </div>
      <!-- INTRO TEXT -->
      <!-- <div class="text" bind:this={textElement}>
        {$player?.name}ID checks out. You can enter. But we need your name.
      </div> -->

      <!-- FORM -->
      <div class="form" bind:this={buttonElement}>
        <!-- INPUT -->
        <input
          type="text"
          placeholder="YOUR NAME"
          bind:value={name}
          bind:this={inputElement}
          onkeydown={e => {
            typeHit()
            if (e.key === "Enter") {
              submitForm()
            }
          }}
        />
        <div class="button-container">
          <BigButton
            text={!$isSessionReady ? "Setting up..." : "SIGN"}
            onclick={submitForm}
            disabled={!name || !$sessionClient || !$isSessionReady}
          />
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
      width: 600px;
      max-width: 90dvw;

      .mascot-container {
        width: 300px;
        height: 300px;
        pointer-events: none;
      }

      .form {
        display: flex;
        width: 100%;
        flex-wrap: wrap;
        margin-top: 20px;

        input {
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
          width: 100%;
          height: 80px;
          margin-bottom: 20px;
          text-align: center;

          &::placeholder {
            color: var(--color-grey-light);
          }
        }

        .button-container {
          width: 100%;
          height: 120px;
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
