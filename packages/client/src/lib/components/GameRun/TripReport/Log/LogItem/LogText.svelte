<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"
  import { typeHit, playSound, randomPitch } from "$lib/modules/sound"
  import { parseLogText } from "./parseLogText"

  let {
    logEntry,
    onTimeline
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  const CHARACTER_DELAY = 0.04

  // Element
  let logTextElement = $state<HTMLSpanElement | null>(null)

  // Timeline
  const timeline = gsap.timeline()

  // Tag configuration system
  type SoundMode = "each" | "first"

  type TagConfig = {
    className: string
    sound: () => void
    soundMode: SoundMode
  }

  const TAG_CONFIG: Record<string, TagConfig> = {
    ITEM: {
      className: "item-ref",
      sound: () => playSound({ category: "ratfunUI", id: "itemPositive" }),
      soundMode: "first"
    },
    QUOTE: {
      className: "quote",
      sound: () => playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() }),
      soundMode: "each"
    },
    SYSTEM: {
      className: "system-message",
      sound: () => typeHit(),
      soundMode: "each"
    },
    BALANCE: {
      className: "balance-message",
      sound: () => typeHit(),
      soundMode: "each"
    }
  }

  const PLAIN_CONFIG: TagConfig = {
    className: "",
    sound: () => typeHit(),
    soundMode: "each"
  }

  const KNOWN_TAGS = Object.keys(TAG_CONFIG)

  // Current typing state
  let currentSegmentIndex = $state(0)
  let currentCharIndex = $state(0)

  // Type hit helper - handles segments with config-based sounds
  const handleCharacter = () => {
    if (!logTextElement) return

    const segments = parseLogText(logEntry.event, KNOWN_TAGS)
    if (currentSegmentIndex >= segments.length) return

    const segment = segments[currentSegmentIndex]
    const char = segment.text[currentCharIndex]
    const config = segment.type === "plain" ? PLAIN_CONFIG : TAG_CONFIG[segment.type]

    // Find or create the current segment span
    let segmentSpan = logTextElement.children[currentSegmentIndex] as HTMLSpanElement
    if (!segmentSpan) {
      segmentSpan = document.createElement("span")
      if (config.className) {
        segmentSpan.className = config.className
      }
      logTextElement.appendChild(segmentSpan)
    }

    // Add character to the current segment
    segmentSpan.textContent += char

    // Play sound based on config
    if (config.soundMode === "each" || currentCharIndex === 0) {
      config.sound()
    }

    // Move to next character
    currentCharIndex++

    // If we've finished this segment, move to the next
    if (currentCharIndex >= segment.text.length) {
      currentSegmentIndex++
      currentCharIndex = 0
    }
  }

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Reset state
    currentSegmentIndex = 0
    currentCharIndex = 0

    // Ensure text starts invisible
    gsap.set(logTextElement, {
      opacity: 0
    })
    // Clear potential previous text content if element re-renders
    if (logTextElement) {
      logTextElement.innerHTML = ""
    }
  }

  // Stage 2: Main animation
  const main = () => {
    // Typing Animation
    timeline.set(logTextElement, {
      opacity: 1
    })

    // Calculate total characters across all segments
    const segments = parseLogText(logEntry.event, KNOWN_TAGS)
    const totalChars = segments.reduce((sum, seg) => sum + seg.text.length, 0)

    // Add a call for each character
    for (let i = 0; i < totalChars; i++) {
      timeline.call(handleCharacter, [], `+=${CHARACTER_DELAY}`)
    }
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  // Run once
  const run = () => {
    prepare()
    main() // Build the timeline synchronously
    done() // Call done immediately after building
  }

  // Ensure root element is mounted
  $effect(() => {
    if (logTextElement) {
      run()
    }
  })
</script>

<div class="log-text" bind:this={logTextElement}></div>

<style lang="scss">
  .log-text {
    display: inline-block;
    background: rgba(255, 255, 255, 0.6);
    max-width: 100%;
    padding: 5px;
    color: var(--background);
    line-height: 1.4em;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-large);
    word-wrap: break-word;
    overflow-wrap: break-word;

    :global(.item-ref) {
      background: yellow;
      padding: 2px 4px;
    }

    :global(.quote) {
      background: pink;
      padding: 2px 4px;
    }

    :global(.system-message) {
      background: orangered;
      padding: 2px 4px;
    }

    :global(.balance-message) {
      background: green;
      padding: 2px 4px;
    }

    @media (max-width: 768px) {
      font-size: var(--font-size-normal);
    }
  }
</style>
