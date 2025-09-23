<script lang="ts">
  import type { Room as SanityRoom } from "@sanity-types"
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"

  gsap.registerPlugin(TextPlugin)

  let { staticRoomContent }: { staticRoomContent: SanityRoom | undefined } = $props()

  // Elements
  let textDisplayElement = $state<HTMLDivElement>()

  const text = staticRoomContent?.prompt ?? ""

  // Animation constants
  const CHARACTER_DELAY = 0.01

  // Type hit helper for character
  const playTypeHitText = (char: string) => {
    if (textDisplayElement) {
      textDisplayElement.textContent += char
    }
  }

  onMount(async () => {
    // Prepare animation
    if (textDisplayElement) {
      gsap.set([textDisplayElement], { opacity: 0 })
      textDisplayElement.textContent = ""

      // Fade in the display
      gsap.set(textDisplayElement, { opacity: 1 })

      // Split text string into characters
      const characters = text.split("")

      // Function to continuously type characters
      const typeNextCharacter = (index: number) => {
        if (textDisplayElement) {
          const charIndex = index % characters.length
          playTypeHitText(characters[charIndex])

          // Schedule next character
          setTimeout(() => {
            typeNextCharacter(index + 1)
          }, CHARACTER_DELAY * 1000)
        }
      }

      // Start the endless typing
      typeNextCharacter(0)
    }
  })
</script>

<div class="trip-prompt-box">
  <div class="text-display" bind:this={textDisplayElement}></div>
</div>

<style lang="scss">
  .trip-prompt-box {
    width: 100%;
    height: 100%;

    .text-display {
      text-align: left;
      white-space: pre-line;
      line-height: 1em;
      width: 100%;
      padding-left: 2px;
      font-size: 8px;
      letter-spacing: 2px;
      word-break: break-word;
      overflow: hidden;
      height: 100%;
      color: #626262;
    }
  }
</style>
