<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/Main/RoomResult/types"
  import type { OutcomeDataStringMap } from "$lib/components/Main/RoomResult/types"
  import { updateFrozenState } from "$lib/components/Main/RoomResult/state.svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { playSound, randomPitch } from "$lib/modules/sound"
  import OutcomeItem from "$lib/components/Main/Shared/OutcomeItem/OutcomeItem.svelte"
  import {
    TIMESTAMP_DURATION,
    CHARACTER_DELAY,
    OUTCOME_DELAY,
    OUTCOME_DURATION,
    OUTCOME_START_DELAY,
  } from "./config"

  gsap.registerPlugin(TextPlugin)

  // Type for registered outcome elements
  type RegisteredOutcome = {
    node: HTMLElement
    data: DOMStringMap | LogEntryFields
  }

  type LogEntryFields = {
    id?: string
    name: string
    value: number
    action: string
    type: string
  }

  let {
    logEntry,
    delay = 0,
    onTimeline,
  }: {
    logEntry: MergedLogEntry
    delay: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let element = $state<HTMLDivElement | null>(null)
  let logTextElement = $state<HTMLSpanElement | null>(null)
  let timestampElement = $state<HTMLSpanElement | null>(null)
  // {#each} elements
  let registeredOutcomes = $state<RegisteredOutcome[]>([])

  // Timeline
  const timeline = gsap.timeline({ delay })

  // Type hit helper
  const typeHit = (char: string) => {
    // Use string type hint
    if (logTextElement) logTextElement.textContent += char
    const sound = playSound("tcm", "type2", false, false, randomPitch())
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
  const register = (node: HTMLElement, data: LogEntryFields) => {
    const registration: RegisteredOutcome = { node, data }
    console.log(node)

    registeredOutcomes = [...registeredOutcomes, registration]

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
    gsap.set([timestampElement, logTextElement, ".outcome-wrapper"], {
      opacity: 0,
    })
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
      duration: TIMESTAMP_DURATION,
      ease: "power2.out",
    })

    // Typing Animation
    timeline.set(logTextElement, {
      text: "",
      opacity: 1,
    })
    const chars = logEntry.event.split("")
    for (let i = 0; i < chars.length; i++) {
      timeline.call(typeHit, [chars[i]], `+=${CHARACTER_DELAY}`)
    }

    // Add a label to mark the start of outcome animations
    timeline.addLabel("outcomesStart", `+=${OUTCOME_START_DELAY}`)

    // Iterate through the registered outcomes and add their animations
    registeredOutcomes.forEach(({ node, data }, index) => {
      const outcomeStartTime = `outcomesStart+=${index * OUTCOME_DELAY}`

      // State update
      timeline.call(
        updateFrozenState,
        [data as OutcomeDataStringMap],
        outcomeStartTime
      )
      // Sound
      timeline.call(playOutcomeSound, [data.action], outcomeStartTime)
      // Visuals
      timeline.to(
        node,
        {
          opacity: 1,
          duration: OUTCOME_DURATION,
          ease: "power2.out",
        },
        outcomeStartTime
      )
    })

    timeline.addLabel("outcomesFinish", "+=2")
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
    if (element) {
      run()
    }
  })
</script>

<div class="log-entry" bind:this={element}>
  <!-- Timestamp -->
  <div class="timestamp-container" bind:this={timestampElement}>
    <div class="timestamp">
      {logEntry.timestamp}
    </div>
  </div>
  <!-- Log Text -->
  <div class="log-text" bind:this={logTextElement}></div>

  <!-- Outcomes -->
  <div class="outcome-list">
    {#if logEntry.healthChange}
      <div
        class="outcome-wrapper"
        use:register={{
          type: "health",
          action: logEntry.healthChange.amount < 0 ? "reduce" : "increase",
          value: logEntry.healthChange.amount,
          name: "Health",
        }}
      >
        <OutcomeItem
          type="health"
          negative={logEntry.healthChange.amount < 0}
          value={logEntry.healthChange.amount}
        />
      </div>
    {/if}
    {#if logEntry.balanceTransfer}
      <div
        class="outcome-wrapper"
        use:register={{
          type: "balance",
          action: logEntry.balanceTransfer.amount < 0 ? "reduce" : "increase",
          value: logEntry.balanceTransfer.amount,
          name: "Balance",
        }}
      >
        <OutcomeItem
          type="balance"
          negative={logEntry.balanceTransfer.amount < 0}
          value={`$${logEntry.balanceTransfer.amount}`}
        />
      </div>
    {/if}
    {#if logEntry?.traitChanges}
      {#each logEntry?.traitChanges as traitChange}
        <div
          class="outcome-wrapper"
          use:register={{
            type: "trait",
            action: traitChange.type,
            id: traitChange.id,
            value: traitChange.value,
            name: traitChange.name,
          }}
        >
          <OutcomeItem
            type="trait"
            negative={traitChange.type === "remove"}
            value={`${traitChange.name} ($${traitChange.value})`}
          />
        </div>
      {/each}
    {/if}
    {#if logEntry?.itemChanges}
      {#each logEntry?.itemChanges as itemChange}
        <div
          class="outcome-wrapper"
          use:register={{
            type: "item",
            action: itemChange.type,
            id: itemChange.id,
            value: itemChange.value,
            name: itemChange.name,
          }}
        >
          <OutcomeItem
            type="item"
            negative={itemChange.type === "remove"}
            value={`${itemChange.name} ($${itemChange.value})`}
          />
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

    .timestamp-container {
      margin-right: 10px;

      .timestamp {
        display: inline-block;
        background: var(--color-alert-priority);
        padding: 5px;
        color: var(--background);
      }
    }

    .log-text {
      display: inline-block;
      background: var(--color-grey-light);
      padding: 5px;
      color: var(--background);
      max-width: 60%;
      font-family: var(--special-font-stack);
      font-size: 24px;
    }

    .outcome-list {
      margin-left: 10px;
      display: flex;
      flex-direction: row;
      gap: 5px;
      flex-wrap: wrap;
    }
  }
</style>
