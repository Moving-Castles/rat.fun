<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { typeHit } from "$lib/modules/sound/state.svelte"

  gsap.registerPlugin(TextPlugin)

  // Elements
  let textDisplayElement = $state<HTMLDivElement>()

  const text = [
    "= Pneumatic system engaged",
    `= Rat ${$rat.name} conveyed to trip chamber`,
    "= Trip chamber lid closed",
    "= RAT-o-FUN harness secured",
    "= PETA approved Diaper attached",
    "= Intercranial probes attached",
    "= Rat dosed with 44mg of Slopamine",
    "= Video feed activated",
    "= Trip initiated....."
  ]

  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined

  // Animation constants
  const CHARACTER_DELAY = 0.012
  const LINE_DELAY = 0.03

  // Create parent timeline
  const splashScreenTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" }
  })

  // Type hit helper for text array
  const playTypeHitText = (char: string) => {
    if (textDisplayElement) {
      textDisplayElement.textContent += char
      typeHit()
    }
  }

  onMount(async () => {
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
  })
</script>

<div class="text-log-box">
  <div class="text-display" bind:this={textDisplayElement}></div>
</div>

<style lang="scss">
  .text-log-box {
    width: 100%;
    height: 100%;

    .text-display {
      text-align: left;
      white-space: pre-line;
      line-height: 1em;
      width: 100%;
      padding-left: 2px;
      font-size: 22px;
      letter-spacing: 2px;
    }
  }
</style>
