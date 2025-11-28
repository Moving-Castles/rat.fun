<script lang="ts">
  import type { TripEvent, TripEventBaseline } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max } from "d3-array"
  import { line } from "d3-shape"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    smallIcons = false,
    plotData,
    isEmpty = false,
    height = 300
  }: { smallIcons?: boolean; plotData: TripEvent[]; isEmpty: boolean; height?: number } = $props()

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
    const domainEnd = max(plotData, (d: TripEvent) => d.time)
    const finalDomainEnd =
      domainEnd !== undefined && domainEnd > domainStart ? domainEnd : domainStart + 1 // Add a minimal duration if only one point or max isn't greater

    return scaleTime().domain([domainStart, finalDomainEnd]).range([0, innerWidth])
  })

  let yScale = $derived.by(() => {
    if (!plotData || plotData.length === 0 || !innerHeight) return null // Use innerHeight here

    // Ensure the domain includes 0 and accommodates the highest value + buffer
    const maxValue = max(plotData, (d: TripEvent) => +d.value) ?? 0
    return scaleLinear()
      .domain([0, Math.max(plotData[0].value * 2, maxValue)])
      .range([innerHeight, 0]) // Use innerHeight
  })

  // Line function from D3 to create the d attribute for a path element
  // which will be our line.
  let lineGenerator = $derived(
    xScale && yScale
      ? line<TripEvent>()
          .x((d: TripEvent) => xScale(d.time))
          .y((d: TripEvent) => yScale(+d.value))
      : // .curve(curveBasis)
        null
  )

  // Generate points specifically for the full-width baseline
  let baselinePoints = $derived.by<TripEventBaseline[] | null>(() => {
    if (!xScale || !yScale || !plotData || plotData.length === 0) return null

    const [domainStart, domainEnd] = xScale.domain()
    const firstValue = plotData[0].value // Value of the first data point
    const baselineSource = plotData[0]
    const domainStartTime =
      domainStart instanceof Date ? domainStart.getTime() : Number(domainStart)
    const domainEndTime = domainEnd instanceof Date ? domainEnd.getTime() : Number(domainEnd)

    // Create two points spanning the full domain width at the first data point's y-level
    // These points need 'time' and 'value' structure to work with lineGenerator
    return [
      {
        eventType: TRIP_EVENT_TYPE.BASELINE,
        time: domainStartTime,
        value: firstValue,
        valueChange: 0,
        index: baselineSource.index,
        tripId: baselineSource.tripId,
        tripCreationCost: baselineSource.tripCreationCost,
        meta: undefined
      }, // Point at the start of the domain
      {
        eventType: TRIP_EVENT_TYPE.BASELINE,
        time: domainEndTime,
        value: firstValue,
        valueChange: 0,
        index: baselineSource.index,
        tripId: baselineSource.tripId,
        tripCreationCost: baselineSource.tripCreationCost,
        meta: undefined
      } // Point at the end of the domain
    ]
  })

  const generateTooltipContent = (point: TripEvent) => {
    let toolTipContent = `<div>Trip balance: <span class="tooltip-value">${point.value} ${CURRENCY_SYMBOL}</span>`

    if (point.valueChange) {
      const valueChangeClass =
        point.valueChange > 0 ? "tooltip-value-positive" : "tooltip-value-negative"
      toolTipContent += `<br/>Change: <span class="${valueChangeClass}">${point.valueChange}</span></div>`
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
      <span>{UI_STRINGS.noData.toUpperCase()}</span>
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
              <Tooltip
                content={generateTooltipContent(point)}
                svg={true}
                props={{ allowHTML: true }}
              >
                <g>
                  {#if !point.valueChange || point.valueChange === 0}
                    <circle
                      fill="var(--color-value)"
                      r={smallIcons ? 3 : 6}
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point.valueChange > 0}
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
              </Tooltip>
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
