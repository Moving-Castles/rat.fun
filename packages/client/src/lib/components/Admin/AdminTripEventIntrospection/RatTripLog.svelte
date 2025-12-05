<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import type { Outcome } from "@sanity-types"
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { gsap } from "gsap"
  import { typeHit } from "$lib/modules/sound"
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"
  import { mergeLog } from "$lib/components/GameRun/TripReport/Log"

  let { result }: { result: Outcome } = $props()
  let timeline = $state(gsap.timeline())

  // ???
  let mergedLog: MergedLogEntry[] = $derived(mergeLog(result as unknown as EnterTripReturnValue))
  let logEntryElements: HTMLDivElement[] = $state([])

  onMount(() => {
    logEntryElements.forEach((el, i) => {
      if (el) {
        gsap.set(el, { opacity: 0, y: 10 })
        timeline.call(typeHit, undefined, 0.2 + i * 0.05)
        timeline.to(
          el,
          {
            opacity: 1,
            y: 0,
            duration: 0.05,
            ease: "power2.out"
          },
          0.2 + i * 0.05
        )
      }
    })
  })

  onDestroy(() => {
    if (timeline) {
      timeline.clear()
    }
  })
</script>

<div class="rat-trip-log">
  <!-- Right Panel: Event Log -->
  <div class="log-panel">
    <div class="log-container">
      {#if mergedLog}
        {#each mergedLog as entry, i}
          <div class="log-item" bind:this={logEntryElements[i]}>
            <div class="timestamp">{entry.timestamp}</div>
            <div class="log-text">{entry.event}</div>

            {#if entry.balanceTransfer || entry.itemChanges}
              <div class="outcome-list">
                {#if entry.balanceTransfer}
                  <div
                    class="outcome balance-outcome"
                    class:negative={entry.balanceTransfer.amount < 0}
                  >
                    <span class="heart">{HEALTH_SYMBOL}</span>
                    <span class="value"
                      >{entry.balanceTransfer.amount > 0 ? "+" : ""}{entry.balanceTransfer
                        .amount}</span
                    >
                  </div>
                {/if}

                {#if entry.itemChanges}
                  {#each entry.itemChanges as itemChange}
                    <div class="outcome item-outcome" class:negative={itemChange.type === "remove"}>
                      <span class="value">{itemChange.name} (${itemChange.value})</span>
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .rat-trip-log {
    display: flex;
    height: 100%;
    gap: 0;
  }

  // Right Panel: Log
  .log-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: 0 8px;
  }

  .log-container {
    flex: 1;
    overflow-y: auto;
    padding-top: 8px;
  }

  .log-item {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 1.2em;
    font-size: var(--font-size-normal);
    justify-content: flex-start;
    align-items: flex-start;
  }

  .timestamp {
    display: inline-block;
    background: var(--color-alert-priority);
    padding: 5px;
    color: var(--background);
    font-size: var(--font-size-normal);
    margin-right: 10px;
  }

  .log-text {
    display: inline-block;
    background: var(--color-grey-light);
    padding: 5px;
    color: var(--background);
    max-width: 100%;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
  }

  .outcome-list {
    margin-left: 10px;
    display: flex;
    flex-direction: row;
    gap: 5px;
    flex-wrap: wrap;
  }

  .outcome {
    color: var(--background);
    font-size: var(--font-size-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    // padding-inline: 10px;
    white-space: nowrap;
  }

  .balance-outcome {
    background: var(--color-value);

    &.negative {
      background: var(--color-death);
    }
  }

  .item-outcome {
    background: var(--color-success);

    &.negative {
      background: var(--color-death);
    }
  }

  .heart {
    display: inline-block;
    margin-right: 5px;
  }
</style>
