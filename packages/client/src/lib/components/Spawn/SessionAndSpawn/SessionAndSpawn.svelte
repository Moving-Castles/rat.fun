<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"

  import { typeHit } from "$lib/modules/sound"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"

  let name = $state("")

  let mascotElement: HTMLDivElement | null = $state(null)
  let inputElement: HTMLInputElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  function submitForm() {
    console.log("[SessionAndSpawn] Submit form with name:", name)

    // Validate name before transitioning
    if (!name || name.trim() === "") {
      console.warn("[SessionAndSpawn] Name cannot be empty")
      return
    }

    if (name.length > 50) {
      console.warn("[SessionAndSpawn] Name is too long (maximum 50 characters)")
      return
    }

    // Store name in state machine
    spawnState.data.setPlayerName(name)
    console.log("[SessionAndSpawn] Name stored, transitioning to SESSION_AND_SPAWN__LOADING")

    // Transition to loading state
    spawnState.state.transitionTo(SPAWN_STATE.SESSION_AND_SPAWN__LOADING)
  }

  onMount(() => {
    console.log("[SessionAndSpawn] Component mounted")

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
    <!-- MASCOT -->
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot entranceOn={true} bigDanceOn={true} />
    </div>

    <div class="text-container">
      <p>sign session key for machine to execute fast</p>

      <p>everything your fault</p>
      <p>is skill game</p>

      <p>enter your operator name to agree</p>
    </div>

    <!-- FORM -->
    <div class="form" bind:this={buttonElement}>
      <!-- INPUT -->
      <input
        type="text"
        placeholder="SIGN YOUR NAME"
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
        <BigButton text="EVERYTHING IS MY FAULT" onclick={submitForm} disabled={!name} />
      </div>
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
    }
  }
</style>
