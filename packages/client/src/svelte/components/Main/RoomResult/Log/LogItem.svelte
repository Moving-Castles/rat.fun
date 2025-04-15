<script lang="ts">
  import type { MergedLogEntry } from "@components/Main/RoomResult/Log/types"
  import { updateState } from "@components/Main/RoomResult/state.svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { playSound, randomPitch } from "@modules/sound"

  gsap.registerPlugin(TextPlugin)

  // Type for registered outcome elements
  type RegisteredOutcome = {
    node: HTMLElement
    data: DOMStringMap
  }

  let {
    logEntry,
    onTimeline,
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let element = $state<HTMLDivElement | null>(null)
  let logTextElement = $state<HTMLSpanElement | null>(null)
  let timestampElement = $state<HTMLSpanElement | null>(null)
  // {#each} elements
  let registeredOutcomes = $state<RegisteredOutcome[]>([])

  // Timeline
  const timeline = gsap.timeline()

  // Type hit helper
  const typeHit = (char: string) => {
    // Use string type hint
    if (logTextElement) logTextElement.textContent += char
    const sound = playSound("tcm", "typingCant", false, false, randomPitch())
    if (sound) sound.play()
  }

  // Outcome sound helper
  const playOutcomeSound = (action: string) => {
    const soundName =
      action === "increase" || action === "add"
        ? "acceptOrderSuccessOld"
        : "acceptOrderFail"
    const sound = playSound("tcm", soundName)
    if (sound) sound.play()
  }

  // Action to register the nodes
  const register = (node: HTMLElement) => {
    const data = node.dataset
    const registration: RegisteredOutcome = { node, data }

    // Add to our reactive state array
    registeredOutcomes = [...registeredOutcomes, registration]
    // console.log("Registered outcome:", data.type) // For debugging

    // Return destroy function for cleanup
    return {
      destroy: () => {
        // console.log("Destroying outcome:", data.type) // For debugging
        registeredOutcomes = registeredOutcomes.filter(
          item => item.node !== node
        )
      },
    }
  }

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Ensure all parts start invisible
    gsap.set([timestampElement, logTextElement, ".outcome"], { opacity: 0 })
    // Clear potential previous text content if element re-renders
    if (logTextElement) logTextElement.textContent = ""
  }

  // Stage 2: Main animation
  const main = () => {
    // Timestamp Animation
    timeline.call(() => {
      const sound = playSound("tcm", "textLineHit")
      if (sound) sound.play()
    })
    timeline.to(timestampElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    })

    // Typing Animation
    timeline.set(logTextElement, {
      text: "",
      opacity: 1,
    })
    const chars = logEntry.event.split("")
    for (let i = 0; i < chars.length; i++) {
      timeline.call(typeHit, [chars[i]], "+=0.04") // 40ms delay per character
    }

    // Add a label to mark the start of outcome animations
    timeline.addLabel("outcomesStart", "+=0.2")

    // Iterate through the registered outcomes and add their animations
    registeredOutcomes.forEach(({ node, data }, index) => {
      const outcomeStartTime = `outcomesStart+=${index * 0.4}`

      // State update
      timeline.call(updateState, [data], outcomeStartTime)
      // Sound
      timeline.call(playOutcomeSound, [data.action], outcomeStartTime)
      // Visuals
      timeline.to(
        node,
        {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
        },
        outcomeStartTime
      )
    })

    timeline.addLabel("outcomesFinish", "+=0.2")

    // Check the rats health
    // if ($frozenRat?.health === 0) {
    //   timeline.add(ratTimeline)
    //   ratTimeline.to(".death", { opacity: 1 }, "outcomesFinish", "+=0.2")
    // }
  }

  // When it's all said and done
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
    // console.log("Timeline built:", timeline.duration()) // For debugging
  }

  // Run once
  const run = () => {
    prepare()
    main() // Build the timeline synchronously
    done() // Call done immediately after building
  }

  // Ensure root element is mounted
  $effect(() => {
    if (element) run()
  })
</script>

<div class="log-entry" bind:this={element}>
  <div class="text" bind:this={timestampElement}>
    <span class="timestamp">
      {logEntry.timestamp}
    </span>
    <span class="log-text" bind:this={logTextElement}> </span>
  </div>

  <div class="outcome-list">
    {#if logEntry.healthChange}
      <div
        use:register
        class="outcome health"
        data-type="health"
        data-action={logEntry.healthChange.amount < 0 ? "reduce" : "increase"}
        data-value={logEntry.healthChange.amount}
        data-name="Health"
        class:negative={logEntry.healthChange.amount < 0}
      >
        <span class="title">Health</span>
        <span class="value">{logEntry.healthChange.amount}</span>
      </div>
    {/if}
    {#if logEntry.balanceTransfer}
      <div
        use:register
        class="outcome balance"
        data-type="balance"
        data-action={logEntry.balanceTransfer.amount < 0
          ? "reduce"
          : "increase"}
        data-value={logEntry.balanceTransfer.amount}
        data-name="Balance"
        class:negative={logEntry.balanceTransfer.amount < 0}
      >
        <span class="value">${logEntry.balanceTransfer.amount}</span>
      </div>
    {/if}
    {#if logEntry.traitChanges}
      {#each logEntry.traitChanges as traitChange}
        <div
          use:register
          class="outcome trait"
          data-type="trait"
          data-action={traitChange.type}
          data-id={traitChange.id}
          data-value={traitChange.value}
          data-name={traitChange.name}
          class:negative={traitChange.value <= 0}
          class:remove={traitChange.type === "remove"}
        >
          {traitChange.name} (${traitChange.value})
        </div>
      {/each}
    {/if}
    {#if logEntry.itemChanges}
      {#each logEntry.itemChanges as itemChange}
        <div
          use:register
          class="outcome item"
          data-type="item"
          data-action={itemChange.type}
          data-id={itemChange.id}
          data-value={itemChange.value}
          data-name={itemChange.name}
          class:remove={itemChange.type === "remove"}
        >
          {itemChange.name} (${itemChange.value})
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .log-entry {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 1.4em;
    height: 2em;

    .timestamp {
      background: var(--color-grey-light);
      padding: 5px;
      color: black;
    }
  }

  .outcome {
    opacity: 0;
    background: var(--color-health);
    color: black;
    height: 30px;
    line-height: 30px;
    padding-inline: 10px;
    font-size: 12px;
    position: relative;
    top: -6px;
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
