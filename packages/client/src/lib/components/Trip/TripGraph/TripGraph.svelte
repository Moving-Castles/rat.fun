<script lang="ts">
  import type { PlotPoint } from "./types"

  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let {
    smallIcons = false,
    plotData,
    isEmpty = false,
    height = 300
  }: { smallIcons?: boolean; plotData: PlotPoint[]; isEmpty: boolean; height?: number } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth

  const padding = { top: 6, right: 12, bottom: 6, left: 6 }

  // Calculate inner dimensions based on padding
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

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
    if (!plotData || plotData.length === 0 || !innerHeight) return null // Use innerHeight here

    // Ensure the domain includes 0 and accommodates the highest value + buffer
    const maxValue = max(plotData, (d: PlotPoint) => +d.value) ?? 0
    return scaleLinear()
      .domain([0, Math.max(plotData[0].value * 2, maxValue)])
      .range([innerHeight, 0]) // Use innerHeight
  })

  // Line function from D3 to create the d attribute for a path element
  // which will be our line.
  let lineGenerator = $derived(
    xScale && yScale
      ? line<PlotPoint>()
          .x((d: PlotPoint) => xScale(d.time))
          .y((d: PlotPoint) => yScale(+d.value))
      : // .curve(curveBasis)
        null
  )

  // Generate points specifically for the full-width baseline
  let baselinePoints = $derived.by(() => {
    if (!xScale || !yScale || !plotData || plotData.length === 0) return null

    const domain = xScale.domain() // Get the full domain [start, end]
    const firstValue = plotData[0].value // Value of the first data point

    // Create two points spanning the full domain width at the first data point's y-level
    // These points need 'time' and 'value' structure to work with lineGenerator
    return [
      {
        time: domain[0].getTime(),
        value: firstValue,
        meta: { time: domain[0].getTime(), tripValue: firstValue, meta: {} }
      }, // Point at the start of the domain
      {
        time: domain[1].getTime(),
        value: firstValue,
        meta: { time: domain[1].getTime(), tripValue: firstValue, meta: {} }
      } // Point at the end of the domain
    ]
  })

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
    let toolTipContent = `<div>Trip balance: <span class="tooltip-value">${CURRENCY_SYMBOL}${point?.meta?.tripValue}</span>`

    if (point?.meta?.tripValueChange) {
      const valueChangeClass =
        point.meta.tripValueChange > 0 ? "tooltip-value-positive" : "tooltip-value-negative"
      toolTipContent += `<br/>Change: <span class="${valueChangeClass}">${point?.meta?.tripValueChange}</span></div>`
    }

    return toolTipContent
  }
</script>

<div class="trip-graph">
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
      {#if plotData && width && xScale && yScale && lineGenerator}
        <svg {width} {height}>
          <rect class="fake-background" width={padding.right} {height} x={width - padding.right}
          ></rect>

          <g transform="translate({padding.left}, {padding.top})">
            <path
              d={lineGenerator(plotData)}
              stroke="var(--color-value)"
              stroke-width={2}
              stroke-dasharray={4}
              fill="none"
            />

            {#if baselinePoints}
              <path
                d={lineGenerator(baselinePoints)}
                stroke="#eee"
                stroke-width={1}
                stroke-dasharray="4 4"
                fill="none"
              />
            {/if}

            {#each plotData as point (point.time)}
              <g data-tippy-content={generateTooltipContent(point)}>
                {#if !point?.meta?.tripValueChange || point?.meta?.tripValueChange === 0}
                  <circle
                    fill="var(--color-value)"
                    r={smallIcons ? 3 : 6}
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else if point?.meta?.tripValueChange > 0}
                  <polygon
                    transform="translate({xScale(point.time)}, {yScale(
                      point.value
                    )}) scale({smallIcons ? 1 : 1}, {smallIcons ? 1.5 : 3})"
                    fill="var(--color-value-up)"
                    points="-5 2.5, 0 -5, 5 2.5"
                  />
                {:else}
                  <polygon
                    transform="translate({xScale(point.time)}, {yScale(
                      point.value
                    )}) scale({smallIcons ? 2 : 1}, {smallIcons ? 1.5 : 3})"
                    fill="var(--color-value-down)"
                    points="-5 -2.5, 0 5, 5 -2.5"
                  />
                {/if}
              </g>
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

  .trip-graph {
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
