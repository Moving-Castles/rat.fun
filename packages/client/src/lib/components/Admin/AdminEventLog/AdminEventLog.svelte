<script lang="ts">
  import { Icon } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"
  import { adminUnlockedAt, focusEvent } from "$lib/modules/ui/state.svelte"

  let {
    eventData,
    focus = $bindable(),
    localFocusEvent = $bindable(),
    nosync = false,
    behavior = "hover"
  } = $props()

  $effect(() => {
    if (!nosync) {
      $focusEvent = localFocusEvent
    }
  })

  let data = $derived(eventData.toReversed().filter(p => p.eventType !== "baseline"))
  let tooltipContent = $derived.by(() => {
    return data.map(p => {
      if (p.eventType === "trip_visit" || p.eventType === "trip_death") {
        return p?.meta?.readableLog?.split(",").join("\n<br>")
      } else {
        return p.ownerName
      }
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
  {#each data as point, i (point.index)}
    <a
      class="event"
      href={point.eventType === "trip_visit" || point.eventType === "trip_death"
        ? `/admin/${point.meta.tripId}?focusId=${point.meta._id}`
        : `/admin/${point.meta._id}`}
      onpointerdown={() => {}}
      onpointerup={() => {
        if (behavior === "click") {
          localFocusEvent = point.index
        }
      }}
      onpointerenter={() => {
        if (behavior === "hover") {
          localFocusEvent = point.index
        }
      }}
      onpointerleave={() => {
        if (behavior === "hover") {
          localFocusEvent = -1
        }
      }}
      class:focus={localFocusEvent === point.index}
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
    <!-- </Tooltip> -->
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
    // display: flex;
    flex-flow: column nowrap;
    align-items: start;
    justify-content: flex-start;
    gap: 4px;
    padding: 4px;

    .event {
      padding: 0;
      margin: 0;
      color: white;
      display: block;
      margin-bottom: 4px;

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
