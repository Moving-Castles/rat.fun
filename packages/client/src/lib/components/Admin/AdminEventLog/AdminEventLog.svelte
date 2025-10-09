<script lang="ts">
  import { Icon } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"
  import { adminUnlockedAt, focusEvent } from "$lib/modules/ui/state.svelte"
  import tippy from "tippy.js"

  let { eventData, focus = $bindable() } = $props()

  $effect(() => {
    tippy("[data-tippy-content]", {
      followCursor: true,
      allowHTML: true
    })
  })

  $inspect(eventData)
</script>

{#snippet ratVisitEvent(p)}
  <Icon name="Paw" width={10} /> {p.meta.ownerName} sent {p.meta.ratName} to trip #{p.meta.index}
{/snippet}

{#snippet tripLiquidated(p)}
  <Icon width={10} name="Handshake" fill="white" /> You liquidated trip #{p.meta.index}
{/snippet}

{#snippet ratDied(p)}
  <Icon width={10} name="Cross" fill="white" /> {p.meta.ratName} died tripping #{p.meta.index}
{/snippet}

{#snippet tripCreated(p)}
  <Icon width={10} name="Asterisk" fill="white" /> You created trip #{p.meta.index}
{/snippet}

<div class="admin-event-log">
  {#each eventData.toReversed().filter(p => p.eventType !== "baseline") as point}
    <p
      data-tippy-content={point.meta.index}
      onpointerenter={() => ($focusEvent = point.index)}
      onpointerleave={() => ($focusEvent = -1)}
      class="event"
      class:focus={$focusEvent === point.index}
    >
      {#if point.eventType === "trip_visit"}
        {@render ratVisitEvent(point)}
      {:else if point.eventType === "trip_liquidated"}
        {@render tripLiquidated(point)}
      {:else if point.eventType === "trip_created"}
        {@render tripCreated(point)}
      {:else if point.eventType === "trip_death"}
        {@render ratDied(point)}
      {/if}
      <span class="meta">{timeSince(new Date(point.time).getTime())}</span>
    </p>
  {/each}
  <p class="event">
    You unlocked the panel <span class="meta"
      >{timeSince(new Date($adminUnlockedAt).getTime())}</span
    >
  </p>
</div>

<style lang="scss">
  .admin-event-log {
    background: var(--color-grey-dark);
    height: 100%;
    max-height: 800px;
    overflow-y: scroll;
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
    padding: 4px;

    .event {
      padding: 0;
      margin: 0;

      cursor: pointer;
      &.focus {
        background: black;
      }
    }
  }

  .meta {
    font-size: var(--font-size-normal);
    color: var(--color-grey-light);
    text-align: center;
    margin-bottom: 20px;
  }
</style>
