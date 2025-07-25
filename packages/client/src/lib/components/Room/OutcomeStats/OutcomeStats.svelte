<script lang="ts">
  import OutcomeItem from "../OutcomeItem/OutcomeItem.svelte"

  let { logEntry } = $props()
</script>

{#if logEntry.balanceTransfer}
  <div class="outcome-wrapper">
    <OutcomeItem
      type="balance"
      negative={logEntry.balanceTransfer.amount < 0}
      value={`$${logEntry.balanceTransfer.amount}`}
    />
  </div>
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
