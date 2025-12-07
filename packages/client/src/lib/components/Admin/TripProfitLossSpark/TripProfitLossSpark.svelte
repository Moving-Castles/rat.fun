<script lang="ts">
  import type {
    TripEventCreation,
    TripEventLiquidation,
    TripEventDeath,
    TripEventVisit
  } from "$lib/components/Admin/types"
  import { scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    plotData,
    isEmpty = false,
    height = 300
  }: {
    plotData: (TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit)[]
    isEmpty: boolean
    height?: number
  } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth

  const padding = { top: 0, right: 0, bottom: 0, left: 0 }

  // Calculate inner dimensions based on padding
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  // Computed values
  let xScale = $derived.by(() => {
    // Ensure data exists, has items, and innerWidth is calculated
    if (!plotData || plotData.length === 0 || !innerWidth) return null

    // Evenly space events by index
    const domainStart = 0
    const domainEnd = plotData.length - 1

    return scaleLinear().domain([domainStart, domainEnd]).range([0, innerWidth])
  })

  let yScale = $derived.by(() => {
    if (!plotData || plotData.length === 0 || !innerHeight) return null

    const maxValue = Number(max(plotData, d => +d.value) ?? 0)
    const minValue = Number(min(plotData, d => +d.value) ?? 0)
    const fraction = (maxValue - minValue) / 12

    return scaleLinear()
      .domain([minValue - fraction, maxValue + fraction])
      .range([innerHeight, 0])
  })

  // Line function from D3 to create the d attribute for a path element
  // which will be our line.
  let lineGenerator = $derived(
    xScale && yScale
      ? line<TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit>()
          .x(
            (
              d: TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit,
              i: number
            ) => xScale(i)
          )
          .y((d: TripEventCreation | TripEventLiquidation | TripEventDeath | TripEventVisit) =>
            yScale(+d.value)
          )
      : null
  )
</script>

<div class="trip-graph">
  {#if isEmpty}
    <div style:height="{height}px" class="no-data">
      <span>{UI_STRINGS.noData.toUpperCase()}</span>
    </div>
  {:else}
    <div class="graph" bind:clientWidth={width}>
      {#if plotData?.length === 1}
        <div style:height="{height}px" class="no-data">
          <span>{UI_STRINGS.noData.toUpperCase()}</span>
        </div>
      {:else if plotData && width && xScale && yScale && lineGenerator}
        <svg {width} {height}>
          <g transform="translate({padding.left}, {padding.top})">
            <!-- Profit/loss line -->
            <path
              d={lineGenerator(plotData)}
              stroke="var(--color-grey-light)"
              stroke-width={2}
              fill="none"
            />
          </g>
        </svg>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;

    span {
      background: var(--black);
      padding: 2px;
      color: var(--color-bad);
    }
  }

  .trip-graph {
    width: 100%;
    height: 24px;
    position: relative;
    background-size: 11px 11px;
    background-image:
      linear-gradient(to right, var(--color-grey-dark) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-grey-dark) 1px, transparent 1px);
  }

  .graph {
    width: 100%;
    height: 100%;
    right: 0;
    top: 0;
    position: absolute;
  }
</style>
