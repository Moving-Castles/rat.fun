<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import type { Outcome } from "@sanity-types"
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { gsap } from "gsap"
  import { typeHit } from "$lib/modules/sound"
  import { mergeLog } from "$lib/components/GameRun/TripReport/Log"
  import {
    LogTextStatic,
    LogOutcomeHealthStatic,
    LogOutcomeItemStatic
  } from "$lib/components/GameRun"

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
            <LogTextStatic text={entry.event} />

            {#if entry.balanceTransfer || entry.itemChanges}
              <div class="outcome-list">
                {#if entry.balanceTransfer}
                  <LogOutcomeHealthStatic value={entry.balanceTransfer.amount} />
                {/if}

                {#if entry.itemChanges}
                  {#each entry.itemChanges as itemChange}
                    <LogOutcomeItemStatic
                      name={itemChange.name}
                      value={itemChange.value}
                      action={itemChange.type}
                    />
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
    padding-bottom: 40px;
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
    background: var(--color-grey-light);
    padding: 5px;
    color: var(--background);
    font-size: var(--font-size-normal);
    margin-right: 10px;
  }

  .outcome-list {
    margin-left: 10px;
    display: flex;
    flex-direction: row;
    gap: 5px;
    flex-wrap: wrap;
    // Height matches LogTextStatic: font-size-normal * line-height(1.4) + padding(10px)
    height: calc(var(--font-size-normal) * 1.4 + 10px);
  }
</style>
