<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { typeHit, playSound } from "$lib/modules/sound"

  gsap.registerPlugin(TextPlugin)

  const {
    onComplete
  }: {
    onComplete: () => void
  } = $props()

  // Elements
  let roomInnerElement = $state<HTMLDivElement>()
  let textDisplayElement = $state<HTMLDivElement>()

  const text = [
    "= Rat placed in trip chamber",
    "= RAT-o-FUN harness secured",
    "= Intercranial probes attached",
    "= PETA approved Diaper attached",
    "= Rat dosed with 44mg of Slopamine",
    "= Trip initiated....."
  ]

  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined
  let sound = $state()

  // Animation constants
  const CHARACTER_DELAY = 0.02
  const LINE_DELAY = 0.05

  // Create parent timeline
  const splashScreenTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" }
  })

  // Type hit helper for text array
  const playTypeHitText = (char: string) => {
    if (textDisplayElement) textDisplayElement.textContent += char
    typeHit()
  }

  onMount(() => {
    sound = playSound("ratfun", "tripSetup")
    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    // Prepare animation
    if (textDisplayElement) {
      gsap.set([textDisplayElement], { opacity: 0 })
      textDisplayElement.textContent = ""

      // Animate text array line by line
      splashScreenTimeline.set(textDisplayElement!, { opacity: 1 }, "+=0.1")

      text.forEach((line, lineIndex) => {
        // Add line break if not first line
        if (lineIndex > 0) {
          splashScreenTimeline.call(
            () => {
              if (textDisplayElement) textDisplayElement.textContent += "\n"
            },
            [],
            "+=0.1"
          )
        }

        // Type each character in the line
        const lineChars = line.split("")
        for (let i = 0; i < lineChars.length; i++) {
          splashScreenTimeline.call(playTypeHitText, [lineChars[i]], `+=${CHARACTER_DELAY}`)
        }

        // Add delay after each line (except the last one)
        if (lineIndex < text.length - 1) {
          splashScreenTimeline.to({}, { duration: LINE_DELAY })
        }
      })
    }

    setTimeout(() => {
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      onComplete()
    }, 5000)
  })

  onDestroy(() => {
    if (sound) {
      sound.stop()
    }
  })
</script>

<div class="splash-screen">
  <div class="timer">{timeElapsed.toFixed(1)}s</div>
  <div class="inner" bind:this={roomInnerElement}>
    <div class="text-display" bind:this={textDisplayElement}></div>
  </div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    color: var(--foreground);
    font-size: 64px;
    background: rgba(0, 0, 0, 1);

    .timer {
      position: fixed;
      top: 20px;
      right: 20px;
      font-size: 32px;
      font-family: monospace;
      background: var(--color-alert);
      color: var(--background);
      padding: 10px 20px;
      border-radius: 8px;
      min-width: 120px;
      text-align: center;
      z-index: 1000;
    }

    .inner {
      display: flex;
      font-size: 44px;
      .text-display {
        text-align: left;
        white-space: pre-line;
        margin-top: 2rem;
        line-height: 1.5;
        width: 100%;
      }
    }
  }
</style>
