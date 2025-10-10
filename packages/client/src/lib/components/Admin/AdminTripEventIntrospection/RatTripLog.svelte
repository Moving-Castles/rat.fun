<script lang="ts">
  import { gsap } from "gsap"
  import { onMount } from "svelte"
  import { typeHit } from "$lib/modules/sound"

  let { result }: { result: any } = $props()

  // Merge log with outcomes
  type MergedLogEntry = {
    timestamp: string
    event: string
    balanceTransfer?: { logStep: number; amount: number }
    itemChanges?: Array<{
      logStep: number
      type: "add" | "remove"
      name: string
      value: number
      id?: string
    }>
  }

  function mergeLog(result: any): MergedLogEntry[] {
    const mergedLog: MergedLogEntry[] = JSON.parse(JSON.stringify(result.log))
    const balanceTransfers = result.balanceTransfers || []
    const itemChanges = result.itemChanges || []

    for (let i = 0; i < mergedLog.length; i++) {
      // Balance transfers
      const balanceTransfersOnLogStep = balanceTransfers.filter(
        (bT: any) => bT.logStep === i && bT.amount !== 0
      )

      if (balanceTransfersOnLogStep.length > 0) {
        const totalAmount = balanceTransfersOnLogStep.reduce(
          (sum: number, transfer: any) => sum + transfer.amount,
          0
        )
        mergedLog[i].balanceTransfer = {
          logStep: i,
          amount: totalAmount
        }
      }

      // Item changes
      const itemChangesOnStep = itemChanges.filter((iC: any) => iC.logStep === i)
      if (itemChangesOnStep.length > 0) {
        mergedLog[i].itemChanges = itemChangesOnStep
      }
    }

    return mergedLog
  }

  let mergedLog: MergedLogEntry[] = $derived(mergeLog(result))
  let logEntryElements: HTMLDivElement[] = []

  onMount(() => {
    console.log(result)
    // Animate log entries in sequence
    const timeline = gsap.timeline()

    gsap.set(".header1", { opacity: 0 })
    gsap.set(".header2", { opacity: 0 })
    gsap.set(".separator", { opacity: 0 })
    gsap.set(".summary-grid", { opacity: 0 })
    timeline.call(typeHit)
    timeline.to(".header1", {
      opacity: 1,
      duration: 0.1,
      ease: "power2.out"
    })
    timeline.call(typeHit)
    timeline.to(".summary-grid", {
      opacity: 1,
      duration: 0.1,
      ease: "power2.out"
    })
    timeline.call(typeHit)
    timeline.to(".header2", {
      opacity: 1,
      duration: 0.1,
      ease: "power2.out"
    })
    timeline.call(typeHit)
    timeline.to(".separator", {
      opacity: 1,
      duration: 0.2,
      ease: "power2.out"
    })

    logEntryElements.forEach((el, i) => {
      if (el) {
        gsap.set(el, { opacity: 0, y: 10 })
        timeline.call(typeHit, null, 0.2 + i * 0.05)
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
</script>

<div class="rat-trip-log">
  <!-- Left Panel: Summary -->
  <div class="summary-panel">
    <div class="summary-content">
      <h3 class="header1">Trip Summary</h3>

      <div class="summary-grid">
        <div class="summary-row">
          <span class="label">Status</span>
          <span class="value">
            {#if result.ratDead}
              <span class="status-dead">Dead</span>
            {:else if result.tripDepleted}
              <span class="status-depleted">Depleted</span>
            {:else}
              <span>Active</span>
            {/if}
          </span>
        </div>

        <div class="summary-row">
          <span class="label">Balance Transfer</span>
          <span
            class="value"
            class:negative={(result.balanceTransfers || []).reduce(
              (sum, bt) => sum + bt.amount,
              0
            ) < 0}
          >
            {(result.balanceTransfers || []).reduce((sum, bt) => sum + bt.amount, 0)}
          </span>
        </div>

        <div class="summary-row">
          <span class="label">Items Added</span>
          <span class="value">
            {(result.itemChanges || []).filter(ic => ic.type === "add").length}
          </span>
        </div>

        <div class="summary-row">
          <span class="label">Items Removed</span>
          <span class="value">
            {(result.itemChanges || []).filter(ic => ic.type === "remove").length}
          </span>
        </div>

        <div class="summary-row">
          <span class="label">Rat Value</span>
          <span class="value" class:negative={result.ratValueChange < 0}>
            {result.ratValue} ({result.ratValueChange >= 0 ? "+" : ""}{result.ratValueChange})
          </span>
        </div>

        <div class="summary-row">
          <span class="label">Trip Value</span>
          <span class="value" class:positive={result.tripValueChange > 0}>
            {result.tripValue} (+{result.tripValueChange})
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Separator -->
  <div class="separator"></div>

  <!-- Right Panel: Event Log -->
  <div class="log-panel">
    <h3 class="header2">Event Log</h3>
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
                    <span class="heart">♥</span>
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

  // Left Panel: Summary
  .summary-panel {
    width: 400px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .summary-content {
    width: 100%;
    padding: 0 16px 0 8px;
  }

  .summary-content h3 {
    // margin-bottom: 15px;
    font-size: var(--font-size-normal);
    font-weight: normal;
  }

  .summary-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-grey-dark);
    font-size: var(--font-size-normal);

    &:last-child {
      border-bottom: none;
    }
  }

  .summary-row .label {
    opacity: 0.7;
  }

  .summary-row .value {
    &.negative {
      color: var(--color-death);
    }

    &.positive {
      color: var(--color-success);
    }
  }

  .status-dead {
    color: var(--color-death);
  }

  .status-depleted {
    color: var(--color-alert-priority);
  }

  // Separator
  .separator {
    width: 1px;
    background: var(--color-border);
    flex-shrink: 0;
    margin-right: 8px;
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

  .log-panel h3 {
    margin-bottom: 10px;
    font-size: var(--font-size-normal);
    font-weight: normal;
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
    max-width: 60%;
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
