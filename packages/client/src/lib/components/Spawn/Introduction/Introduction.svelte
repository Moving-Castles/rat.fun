<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"

  let mascotElement = $state<HTMLDivElement | null>(null)
  let mascotRef = $state<Mascot | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)
  let currentTextIndex = $state(0)

  const timeline = gsap.timeline()

  type IntroductionSteps = {
    text: string
    buttonLabel: string
  }

  const introductionSteps: IntroductionSteps[] = [
    {
      text: "Gooood moooooorning **OPERATOR**!",
      buttonLabel: "OK"
    },
    {
      text: "Welcome to the **SLOP MACHINE**. A device for exposing test-subjects to drug-induced experiences aka **TRIPS**.",
      buttonLabel: "OK"
    },
    {
      text: "Don't worry! We could never use humans for these experiments. We tried… Now we use **RATS** instead.",
      buttonLabel: "OK"
    },
    {
      text: "**RATS** are not pets!!! DO NOT GET ATTACHED TO THEM!!!!",
      buttonLabel: "OK"
    },
    {
      text: "You send rats into **TRIPS** to earn **TOKENS**. The more they take from the trip, the more valuable they become.",
      buttonLabel: "OK"
    },
    {
      text: "Cash out by killing your **RAT** at any moment...",
      buttonLabel: "OK"
    },
    {
      text: "Can you feel your dopamine injectors tingling already?",
      buttonLabel: "I AM READY"
    }
  ]

  function handleContinue() {
    // If we haven't shown all texts yet, show the next one
    if (currentTextIndex < introductionSteps.length) {
      mascotRef?.showSpeechBubble(introductionSteps[currentTextIndex].text, { autoHide: false })
      currentTextIndex++
    } else {
      // After all texts are shown, transition to next step
      spawnState.state.transitionTo(SPAWN_STATE.SPAWN_FORM)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleContinue()
    }
  }

  onMount(() => {
    if (mascotRef) {
      mascotRef.showSpeechBubble(introductionSteps[0].text, { autoHide: false })
      currentTextIndex = 1
    }

    if (!mascotElement || !buttonElement) {
      return
    }

    // Set initial opacity to 0
    gsap.set([mascotElement, buttonElement], {
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
    <div
      class="mascot-container"
      bind:this={mascotElement}
      role="button"
      tabindex="0"
      onclick={handleContinue}
      onkeydown={handleKeydown}
    >
      <Mascot bind:this={mascotRef} entranceOn={true} smallDanceOn={true} />
    </div>
    <div class="button-container" bind:this={buttonElement}>
      <BigButton
        text={introductionSteps[currentTextIndex - 1]?.buttonLabel ?? ""}
        onclick={handleContinue}
      />
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
      width: 700px;
      max-width: 90dvw;

      .mascot-container {
        width: 400px;
        height: 400px;
        margin-bottom: 20px;
        cursor: pointer;
      }

      .button-container {
        width: 100%;
        height: 160px;
      }
    }
  }
</style>
