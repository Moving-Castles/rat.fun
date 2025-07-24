<script lang="ts">
  import OutcomeItem from "../OutcomeItem/OutcomeItem.svelte"

  let { logEntry } = $props()
</script>

{#if logEntry.healthChange}
  <div class="outcome-wrapper">
    <OutcomeItem
      type="health"
      negative={logEntry.healthChange.amount < 0}
      value={logEntry.healthChange.amount}
    />
  </div>
{/if}
{#if logEntry.balanceTransfer}
  <div class="outcome-wrapper">
    <OutcomeItem
      type="balance"
      negative={logEntry.balanceTransfer.amount < 0}
      value={`$${logEntry.balanceTransfer.amount}`}
    />
  </div>
{/if}
{#if logEntry?.traitChanges}
  {#each logEntry?.traitChanges as traitChange}
    <div class="outcome-wrapper">
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
    <div class="outcome-wrapper">
      <OutcomeItem
        type="item"
        negative={itemChange.type === "remove"}
        value={`${itemChange.name} ($${itemChange.value})`}
      />
    </div>
  {/each}
{/if}
