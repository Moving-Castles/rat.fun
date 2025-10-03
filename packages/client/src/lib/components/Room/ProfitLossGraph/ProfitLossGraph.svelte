<script lang="ts">
  import type { PlotPoint } from "./types"

  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let {
    smallIcons = false,
    plotData,
    isEmpty = false,
    height = 300
  }: { smallIcons?: boolean; plotData: PlotPoint[]; isEmpty: boolean; height?: number } = $props()

  $inspect("plotData for single trip", plotData)

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth

  const padding = { top: 0, right: 0, bottom: 0, left: 0 }

  // Calculate inner dimensions based on padding
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  // Calculate profit/loss data (balance - initial investment)
  let profitLossData = $derived.by(() => {
    if (!plotData || plotData.length === 0) return []

    const initialCost = plotData[0].value
    return plotData.map(point => ({
      time: point.time,
      value: point.value - initialCost,
      meta: {
        ...point.meta,
        balance: point.value,
        investment: initialCost
      }
    }))
  })

  // Computed values
  let xScale = $derived.by(() => {
    // Ensure data exists, has items, and innerWidth is calculated
    if (!plotData || plotData.length === 0 || !innerWidth) return null

    // Use the first point's time as the domain start, max time as the end
    // Handle the case where there's only one data point
    const domainStart = plotData[0].time
    const domainEnd = max(plotData, (d: PlotPoint) => d.time)
    const finalDomainEnd =
      domainEnd !== undefined && domainEnd > domainStart ? domainEnd : domainStart + 1 // Add a minimal duration if only one point or max isn't greater

    return scaleTime().domain([domainStart, finalDomainEnd]).range([0, innerWidth])
  })

  let yScale = $derived.by(() => {
    if (!profitLossData || profitLossData.length === 0 || !innerHeight) return null

    const maxValue = Number(max(profitLossData, d => +d.value) ?? 0)
    const minValue = Number(min(profitLossData, d => +d.value) ?? 0)
    const fraction = (maxValue - minValue) / 12

    return scaleLinear()
      .domain([minValue - fraction, maxValue + fraction])
      .range([innerHeight, 0])
  })

  // Line function from D3 to create the d attribute for a path element
  // which will be our line.
  let lineGenerator = $derived(
    xScale && yScale
      ? line<PlotPoint>()
          .x((d: PlotPoint) => xScale(d.time))
          .y((d: PlotPoint) => yScale(+d.value))
      : null
  )

  // ???
  $effect(() => {
    if (plotData && width && xScale && yScale && lineGenerator) {
      setTimeout(() => {
        tippy("[data-tippy-content]", {
          allowHTML: true
        })
      })
    }
  })

  const generateTooltipContent = (point: PlotPoint) => {
    const balance = point.meta?.balance || 0
    const investment = point.meta?.investment || 0
    return `<div>Balance: <span class="tooltip-value">${CURRENCY_SYMBOL}${balance.toFixed(2)}</span><br/>Investment: <span class="tooltip-value">${CURRENCY_SYMBOL}${investment.toFixed(2)}</span><br/>P/L: <span class="tooltip-value ${point.value >= 0 ? "tooltip-value-positive" : "tooltip-value-negative"}">${CURRENCY_SYMBOL}${point.value.toFixed(2)}</span></div>`
  }
</script>

<div class="room-graph">
  <div class="y-axis">
    <!-- <small class="label">Value</small> -->
  </div>
  <div class="x-axis">
    <!-- <small class="label">Time</small> -->
  </div>

  {#if isEmpty}
    <div style:height="{height}px" class="no-data">
      <span>NO DATA</span>
    </div>
  {:else}
    <div class="graph" bind:clientWidth={width}>
      {#if profitLossData && width && xScale && yScale && lineGenerator}
        <svg {width} {height}>
          <g transform="translate({padding.left}, {padding.top})">
            <!-- Zero line for reference -->
            <line
              x1="0"
              y1={yScale(0)}
              x2={innerWidth}
              y2={yScale(0)}
              stroke="var(--color-grey-mid)"
              stroke-width="1"
              stroke-dasharray="2,2"
            />

            <!-- Profit/loss line -->
            <path
              d={lineGenerator(profitLossData)}
              stroke="var(--color-grey-light)"
              stroke-width={2}
              fill="none"
            />

            {#each profitLossData as point (point.time)}
              <circle
                fill={point.value >= 0 ? "var(--color-value-up)" : "var(--color-value-down)"}
                r={smallIcons ? 3 : 5}
                cx={xScale(point.time)}
                cy={yScale(point.value)}
                data-tippy-content={generateTooltipContent(point)}
              ></circle>
            {/each}
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
      background: var(--color-death);
      padding: 2px;
      color: var(--background);
    }
  }

  .room-graph {
    width: 100%;
    height: 100%;
    position: relative;
    background-size: 20px 20px;
    background-image:
      linear-gradient(to right, var(--color-grey-dark) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-grey-dark) 1px, transparent 1px);
  }

  .y-axis {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    border-right: 1px solid var(--color-grey-mid);
    width: 30px;
    height: 100%;
    position: absolute;
  }

  .x-axis {
    border-bottom: 1px solid var(--color-grey-mid);
    width: 100%;
    height: 30px;
    position: absolute;
    bottom: 0;
    z-index: var(--z-base);
  }

  .graph {
    width: 100%;
    height: 100%;
    right: 0;
    top: 0;
    position: absolute;
  }
</style>
