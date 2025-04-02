<script lang="ts">
  import type { MergedLogEntry } from "@components/Main/RoomResult/Log/types"

  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { playSound, randomPitch } from "@svelte/modules/sound"

  // Register TextPlugin
  gsap.registerPlugin(TextPlugin)

  let {
    logEntry,
    onTimeline,
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let element = $state<HTMLDivElement | null>(null)
  let timestampElement = $state<HTMLSpanElement | null>(null)
  let logTextElement = $state<HTMLSpanElement | null>(null)

  // Create a timeline for this item's animations
  const timeline = gsap.timeline({
    defaults: {},
  })

  // Export the timeline so parent can access it
  $effect(() => {
    if (element) {
      // Set initial state
      gsap.set(timestampElement, { opacity: 0 })
      gsap.set(logTextElement, { opacity: 0 })
      gsap.set(".outcome", { opacity: 0 })

      // Timestamp with sound
      timeline.call(() => {
        const sound = playSound("tcm", "textLineHit")
        if (sound) sound.play()
      })

      timeline.to(timestampElement, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      })

      // Log text with sound and typewriter effect
      timeline.call(() => {
        const sound = playSound("tcm", "listPrint")
        if (sound) sound.play()
      })

      // Set initial empty text and fade in
      timeline.set(logTextElement, {
        text: "",
        opacity: 1,
      })

      // // Animate typing text
      // timeline.to(logTextElement, {
      //   text: {
      //     value: logEntry.event,
      //     delimiter: "", // animate per character
      //   },
      //   duration: logEntry.event.length * 0.04, // adjust timing per character
      //   ease: "none",
      // })

      timeline.call(() => {
        if (logTextElement) logTextElement.textContent = ""
      })

      const chars = logEntry.event.split("")
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i]

        timeline.call(
          () => {
            if (logTextElement) logTextElement.textContent += char
            const sound = playSound(
              "tcm",
              "typingCant",
              false,
              false,
              randomPitch()
            ) // or whatever sound ID you want
            if (sound) sound.play()
          },
          undefined,
          "+=0.04"
        ) // 40ms delay per character
      }

      // Get outcome elements
      const outcomeElements = element?.querySelectorAll(".outcome")

      // Add animation for each outcome element to timeline
      for (let i = 0; i < outcomeElements.length; i++) {
        const outcome = outcomeElements[i]

        // If outcome is negative or remove
        if (
          outcome.classList.contains("negative") ||
          outcome.classList.contains("remove")
        ) {
          timeline.call(() => {
            const sound = playSound("tcm", "acceptOrderFail")
            if (sound) sound.play()
          })
        } else {
          timeline.call(() => {
            const sound = playSound("tcm", "acceptOrderSuccessOld")
            if (sound) sound.play()
          })
        }
        timeline.to(outcome, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        })
      }

      // Dispatch the timeline to the parent
      onTimeline?.(timeline)
    }
  })
</script>

<div class="log-entry" bind:this={element}>
  <div class="text">
    <span class="timestamp" bind:this={timestampElement}>
      {logEntry.timestamp}
    </span>
    <span class="log-text" bind:this={logTextElement}>{logEntry.event}</span>
  </div>
  <div class="outcome-list">
    <!-- Health -->
    {#if logEntry.healthChange}
      <div
        class="outcome health"
        class:negative={logEntry.healthChange.amount < 0}
      >
        <span class="title">Health</span>
        <span class="value">{logEntry.healthChange.amount}</span>
      </div>
    {/if}
    <!-- Balance -->
    {#if logEntry.balanceTransfer}
      <div
        class="outcome balance"
        class:negative={logEntry.balanceTransfer.amount < 0}
      >
        <span class="title">Balance</span>
        <span class="value">{logEntry.balanceTransfer.amount}</span>
      </div>
    {/if}
    <!-- Traits -->
    {#if logEntry.traitChanges}
      {#each logEntry.traitChanges as traitChange}
        <div
          class="outcome trait"
          class:negative={traitChange.value <= 0}
          class:remove={traitChange.type === "remove"}
        >
          {traitChange.name} ({traitChange.value})
        </div>
      {/each}
    {/if}
    <!-- Items -->
    {#if logEntry.itemChanges}
      {#each logEntry.itemChanges as itemChange}
        <div class="outcome item" class:remove={itemChange.type === "remove"}>
          {itemChange.name} ({itemChange.value})
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .log-entry {
    display: flex;
    font-size: 22px;
    margin-bottom: 1em;
    line-height: 1.4em;
    .timestamp {
      background: var(--color-grey-light);
    }
  }

  .outcome {
    opacity: 0;
    background: var(--color-health);
    color: black;
    height: 40px;
    line-height: 40px;
    padding-inline: 10px;
    font-size: 12px;
    position: relative;
    top: -10px;
  }

  .health {
    background: var(--color-health);
    color: black;
  }

  .balance {
    background: var(--color-value);
    color: black;
  }

  .negative {
    background: var(--color-death);
  }

  .remove {
    background: var(--color-death);
  }

  .outcome-list {
    margin-left: 10px;
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
</style>
