<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import { timeSince } from "$lib/modules/utils"

  let { trip }: { trip: Outcome } = $props()
</script>

<div class="past-trip-item">
  <!-- TIME SINCE -->
  <div class="time-since">
    <span>{timeSince(new Date(trip._createdAt).getTime())} ago</span>
  </div>
  <!-- VALUE CHANGE -->
  <div class="value-change">
    <span>
      {#if trip?.ratValueChange ?? 0 > 0}
        +{trip.ratValueChange}
      {:else if trip?.ratValueChange ?? 0 < 0}
        -{trip.ratValueChange}
      {:else}
        {trip.ratValueChange}
      {/if}
    </span>
  </div>
  <!-- ITEMS CHANGES -->
  <div class="items-changes">
    {#each trip?.itemChanges ?? [] as item}
      <p>
        {#if item.type === "add"}
          +
        {:else if item.type === "remove"}
          -
        {/if}
        {item.name}
      </p>
    {/each}
  </div>
  <!-- LOG -->
  <div class="log">
    {#each trip.log ?? [] as item}
      <p>{item.event}</p>
    {/each}
  </div>
</div>

<style lang="scss">
  .past-trip-item {
    width: 100%;
    height: 120px;
    border-bottom: 1px solid var(--color-grey-mid);
    background: var(--background-semi-transparent);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .time-since {
      width: 20%;
      height: 100%;
      border-right: 1px solid var(--color-grey-mid);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-small);
    }

    .value-change {
      width: 20%;
      height: 100%;
      border-right: 1px solid var(--color-grey-mid);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-small);
    }

    .items-changes {
      width: 20%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-small);
      border-right: 1px solid var(--color-grey-mid);

      p {
        margin: 0;
        padding: 0;
      }
    }

    .log {
      width: 40%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1em;
      padding-inline: 10px;
      font-size: var(--font-size-small);

      p {
        margin: 0;
        padding: 0;
      }
    }
  }
</style>
