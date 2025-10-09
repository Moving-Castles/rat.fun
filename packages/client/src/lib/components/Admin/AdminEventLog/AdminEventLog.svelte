<script lang="ts">
  import { Icon } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"
  import { adminUnlockedAt, focusEvent } from "$lib/modules/ui/state.svelte"
  import { goto } from "$app/navigation"
  import tippy, { followCursor } from "tippy.js"
  // For the follow cursor effect
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"

  let { eventData, focus = $bindable() } = $props()

  const tooltipContent = p => {
    if (p.eventType === "trip_visit" || p.eventType === "trip_death") {
      return p.meta.readableLog.split(",").join("\n<br>")
    } else {
      return p.ownerName
    }
  }

  $effect(() => {
    tippy("[data-tippy-content]", {
      followCursor: true,
      plugins: [followCursor],
      allowHTML: true
    })
  })
</script>

{#snippet ratVisitEvent(p)}
  <Icon name="Paw" address={p.meta.owner} width={10} />
  {p.meta.playerName} sent {p.meta.ratName} to trip #{p.meta.index}
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
    <!-- svelte-ignore a11y_missing_attribute -->
    <a
      onpointerup={e => {
        if (point.eventType === "trip_visit" || point.eventType === "trip_death") {
          goto(`/admin/${point.meta.tripId}`)
        }
      }}
      class="event"
      data-tippy-content={tooltipContent(point)}
      onpointerenter={() => ($focusEvent = point.index)}
      onpointerleave={() => ($focusEvent = -1)}
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
    </a>
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
