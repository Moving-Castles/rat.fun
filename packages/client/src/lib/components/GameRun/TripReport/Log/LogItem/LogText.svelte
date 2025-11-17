<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"
  import { typeHit } from "$lib/modules/sound"
  import { playSound, randomPitch } from "$lib/modules/sound"

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

  // Parse markdown-like text
  type TextSegment = { type: "plain" | "item" | "quote"; text: string }

  function parseText(text: string): TextSegment[] {
    const segments: TextSegment[] = []
    let currentIndex = 0

    // Match **text** (items) or _text_ (quotes)
    const regex = /(\*\*.*?\*\*|_.*?_)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      // Add plain text before the match
      if (match.index > currentIndex) {
        segments.push({
          type: "plain",
          text: text.substring(currentIndex, match.index)
        })
      }

      const matchedText = match[0]
      if (matchedText.startsWith("**") && matchedText.endsWith("**")) {
        // Item reference
        segments.push({
          type: "item",
          text: matchedText.slice(2, -2)
        })
      } else if (matchedText.startsWith("_") && matchedText.endsWith("_")) {
        // Quote
        segments.push({
          type: "quote",
          text: matchedText.slice(1, -1)
        })
      }

      currentIndex = match.index + matchedText.length
    }

    // Add remaining plain text
    if (currentIndex < text.length) {
      segments.push({
        type: "plain",
        text: text.substring(currentIndex)
      })
    }

    return segments
  }

  // Current typing state
  let currentSegmentIndex = $state(0)
  let currentCharIndex = $state(0)

  const playQuoteSound = () => {
    playSound("ratfunUI", "chirp", false, false, randomPitch())
  }

  const playItemSound = () => {
    playSound("ratfunUI", "itemPositive")
  }

  // Type hit helper - now handles segments
  const playTypeHit = () => {
    if (!logTextElement) return

    const segments = parseText(logEntry.event)
    if (currentSegmentIndex >= segments.length) return

    const segment = segments[currentSegmentIndex]
    const char = segment.text[currentCharIndex]

    // Find or create the current segment span
    let segmentSpan = logTextElement.children[currentSegmentIndex] as HTMLSpanElement
    if (!segmentSpan) {
      segmentSpan = document.createElement("span")
      if (segment.type === "item") {
        segmentSpan.className = "item-ref"
      } else if (segment.type === "quote") {
        segmentSpan.className = "quote"
      }
      logTextElement.appendChild(segmentSpan)
    }

    // Add character to the current segment
    segmentSpan.textContent += char

    // Play appropriate sound based on segment type
    if (segment.type === "item") {
      playItemSound()
    } else if (segment.type === "quote") {
      playQuoteSound()
    } else {
      typeHit()
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
    const segments = parseText(logEntry.event)
    const totalChars = segments.reduce((sum, seg) => sum + seg.text.length, 0)

    // Add a call for each character
    for (let i = 0; i < totalChars; i++) {
      timeline.call(playTypeHit, [], `+=${CHARACTER_DELAY}`)
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

    @media (max-width: 768px) {
      font-size: var(--font-size-normal);
    }
  }
</style>
