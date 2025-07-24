<script lang="ts">
  import type { Outcome, Room } from "@sanity-types"
  import { addressToRatImage } from "$lib/modules/utils"
  import OutcomeStats from "../OutcomeStats/OutcomeStats.svelte"
  import { timeSince } from "$lib/modules/utils"
  // import { staticContent } from "$lib/modules/content"

  let { outcome }: { outcome: Outcome } = $props()

  // let room = $derived($staticContent?.rooms.find(r => r._id === outcome.roomId))
</script>

<div class="outcome">
  <div class="outcome-header">
    <div class="rat">
      <img class="rat-image" src={addressToRatImage(outcome?.ratId)} />
    </div>
    <div class="stats">
      <div class="headline">
        {outcome?.ratName} entered {timeSince(new Date(outcome._createdAt))} ago
      </div>
      <div class="health">HEALTH: {outcome.ratHealth} ({outcome.healthChange.amount})</div>
      <div class="balance">
        $ {outcome.ratValue} ({outcome.ratValueChange})
      </div>
    </div>
  </div>
  {#each outcome.log as item (item)}
    <p class="log-entry">
      <span class="timestamp-container">{item.timestamp}</span>
      <span class="log-text">
        {item.event}
      </span>
    </p>
  {/each}
</div>

<style lang="scss">
  .outcome {
    background: var(--color-grey-dark);
    padding: 1rem;
    width: 600px;

    .outcome-header {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 1rem;

      .rat {
        min-height: 180px;

        .rat-image {
          width: 180px;
          filter: grayscale(1) contrast(0.4) invert(1);
        }
      }

      .stats {
        gap: 0.4rem;

        .headline {
          font-family: var(--special-font-stack);
          background: var(--color-alert);
          padding: 5px;
          color: var(--background);
          font-size: 30px;
          display: inline-block;
          margin-bottom: 10px;
        }

        .balance {
          background: var(--color-value);
          padding: 5px;
          color: var(--background);
          display: inline-block;
        }

        .health {
          background: var(--color-health);
          padding: 5px;
          color: var(--background);
          display: inline-block;
        }
      }
    }
  }
  .log-entry {
    display: flex;
    align-items: stretch;
    margin-bottom: 0.5em;
    line-height: 1.4em;
    font-family: var(--special-font-stack);

    .timestamp-container {
      margin-right: 10px;
      background: black;
      display: flex;
      height: 2em;
      padding: 5px;
      align-items: center;
    }

    .log-text {
      display: inline;
      background: var(--color-grey-light);
      padding: 5px;
      color: var(--background);
      // max-width: 60%;
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
