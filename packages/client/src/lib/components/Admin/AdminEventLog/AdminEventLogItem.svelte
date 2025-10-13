<script lang="ts">
  import type { PlotPoint } from "$lib/components/Admin/types"
  import { Icon } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"

  let {
    point,
    behavior = "click",
    localFocusEvent,
    setLocalFocusEvent
  }: {
    point: PlotPoint
    behavior?: "hover" | "click"
    localFocusEvent?: number
    setLocalFocusEvent: (index: number) => void
  } = $props()

  const focus = $derived(localFocusEvent === point.index)

  const href = $derived(
    point.eventType === "trip_visit" || point.eventType === "trip_death"
      ? `/admin/${point.meta.tripId}?focusId=${point.meta._id}`
      : `/admin/${point.meta._id}`
  )

  const onpointerdown = () => {
    // ...
  }

  const onpointerup = () => {
    if (behavior === "click") {
      setLocalFocusEvent(point.index)
    }
  }

  const onpointerenter = () => {
    if (behavior === "hover") {
      setLocalFocusEvent(point.index)
    }
  }

  const onpointerleave = () => {
    if (behavior === "hover") {
      setLocalFocusEvent(-1)
    }
  }
</script>

{#snippet ratVisitEvent(p: PlotPoint)}
  <Icon name="Paw" address={(p.meta as Trip).owner} width={10} />
  {(p.meta as Trip).playerName} sent {(p.meta as Trip).ratName} to trip #{(p.meta as Trip).index}
{/snippet}

{#snippet tripLiquidated(p: PlotPoint)}
  <Icon width={10} name="Handshake" fill="white" /> You liquidated trip #{(p.meta as Trip).index}
{/snippet}

{#snippet ratDied(p: PlotPoint)}
  <Icon width={10} name="Cross" fill="white" />
  {(p.meta as Trip).ratName} died tripping #{(p.meta as Trip).index}
{/snippet}

{#snippet tripCreated(p: PlotPoint)}
  <Icon width={10} name="Asterisk" fill="white" /> You created trip #{(p.meta as Trip).index}
{/snippet}

<a class="event" {href} {onpointerdown} {onpointerup} {onpointerenter} {onpointerleave} class:focus>
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

<style lang="scss">
  .event {
    padding: 0;
    margin: 0;
    color: white;
    display: block;
    margin-bottom: 4px;
    cursor: pointer;
    font-size: var(--font-size-small);

    .meta {
      font-size: var(--font-size-small);
      color: var(--color-grey-light);
      text-align: center;
      margin-bottom: 20px;
    }

    &.focus {
      background: black;
    }
  }
</style>
