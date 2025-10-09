<script lang="ts">
  import type { PlotPoint } from "$lib/components/Trip/TripGraph/types"
  import { gamePercentagesConfig } from "$lib/modules/state/stores"

  import { onMount, onDestroy } from "svelte"

  import { playSound } from "$lib/modules/sound"

  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { focusEvent } from "$lib/modules/ui/state.svelte"
  import { blockNumberToTimestamp } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { blockNumber } from "$lib/modules/network"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"

  import "tippy.js/dist/tippy.css" // optional for styling

  let {
    trips,
    focus = $bindable(),
    height = 400,
    graphData = $bindable<PlotPoint[]>()
  }: {
    trips: Trip[]
    focus: string
    height: number
    graphData: PlotPoint[]
  } = $props()

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  let backgroundMusic: Howl | undefined = $state()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let limit = $state(50)
  let timeWindow = $state<"1m" | "1h" | "1d" | "1w" | "all_time" | "events">("events")

  const padding = { top: 0, right: 12, bottom: 0, left: 12 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    if (!allData.length || !innerWidth) return scaleTime()

    const getRelevantDomainStart = () => {
      switch (timeWindow) {
        case "1m":
          return currentTime - 1000 * 60
        case "1h":
          return currentTime - 1000 * 60 * 60
        case "1d":
          return currentTime - 1000 * 60 * 60 * 24
        case "1w":
          return currentTime - 1000 * 60 * 60 * 24 * 7
        case "all_time":
          return Number(min(allData, (d: PlotPoint) => d.time))
        default:
          return 0
      }
    }

    const domainStart =
      timeWindow === "events" ? getRelevantDomainStart() : new Date(getRelevantDomainStart())
    const domainEnd =
      timeWindow === "events" ? Math.min(limit - 1, allData.length - 1) : new Date(currentTime) // Always go to current time

    if (timeWindow === "events") {
      return scaleLinear().domain([domainStart, domainEnd]).range([0, innerWidth])
    } else {
      return scaleTime().domain([domainStart, domainEnd]).range([0, innerWidth])
    }
  })

  let yScale = $derived.by(() => {
    if (!allData.length || !innerHeight) return scaleLinear()

    let yScaleData, maxValue, minValue

    yScaleData = [...profitLossOverTime]

    maxValue = Number(max(yScaleData, (d: PlotPoint) => +d.value) ?? 0)
    minValue = Number(min(yScaleData, (d: PlotPoint) => +d.value) ?? 0)

    const fraction = (maxValue - minValue) / 12

    return scaleLinear()
      .domain([minValue - fraction, maxValue + fraction])
      .range([innerHeight, 0])
  })

  /** All plots for the trips */
  let plots: Record<string, { data: PlotPoint[]; line: any }> = $derived.by(() => {
    const result = Object.fromEntries(
      Object.entries(trips).map(([tripId, trip]) => {
        let sanityTripContent = $staticContent?.trips?.find(r => r.title == tripId)

        const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

        // Sort the outcomes in order of creation
        outcomes.sort((a, b) => {
          return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
        })

        const tripOutcomes = outcomes.reverse()
        const initialTime = new Date(sanityTripContent?._createdAt).getTime()

        const initialPoint = {
          time: initialTime,
          tripValue: Number(trip.tripCreationCost),
          tripValueChange: 0,
          meta: sanityTripContent,
          _createdAt: sanityTripContent?._createdAt,
          eventType: "trip_created"
        }

        // Build the data array with initial point and outcomes
        const dataPoints = [
          initialPoint,
          ...tripOutcomes.map(outcome => ({
            ...outcome,
            eventType: outcome?.ratValue == 0 ? "trip_death" : "trip_visit"
          }))
        ]

        // Add liquidation event if it exists
        if (trip.liquidationBlock && trip.liquidationValue !== undefined && $blockNumber) {
          const liquidationTime = blockNumberToTimestamp(
            Number(trip.liquidationBlock),
            Number($blockNumber)
          )

          // Get the last absolute trip value before liquidation
          const lastTripValue = dataPoints[dataPoints.length - 1]?.tripValue || 0

          const taxed = Number(trip.liquidationValue)
          const tax = $gamePercentagesConfig.taxationCloseTrip
          const untaxed = Math.floor(
            (Number(trip.liquidationValue) * 100) /
              (100 - Number($gamePercentagesConfig.taxationCloseTrip))
          )
          const liquidationValueChange = Number(trip.tripCreationCost) - untaxed

          // Liquidation: you get back the trip value (before tax) and close the position
          // The change is +tripValue to cancel out the accumulated trip value
          dataPoints.push({
            _createdAt: new Date(liquidationTime).toISOString(),
            tripValue: lastTripValue,
            tripValueChange: liquidationValueChange, // Add back the trip value (closing position)
            liquidationBlock: trip.liquidationBlock,
            prompt: "Liquidation",
            eventType: "trip_liquidated"
          })
        }

        // Map data points to store value changes (not accumulated yet)
        const data = dataPoints.map((o, i) => {
          const time = new Date(o?._createdAt).getTime()
          const valueChange = o?.tripValueChange || 0

          return {
            time: time || o.time,
            valueChange: valueChange, // Store the change, not accumulated value
            eventType: o.eventType,
            meta: {
              ...sanityTripContent,
              ...o
            }
          }
        })

        const l = line()
          .x(d => xScale(d.time))
          .y(d => yScale(+d.value))

        // Map the values
        return [
          tripId,
          {
            data,
            line: l
          }
        ]
      })
    )
    return result
  })
  let isEmpty = $derived(Object.values(plots).every(plot => plot.data.length === 0))

  // Combine all data points from all trips and sort by time (used across multiple derived values)
  let allData = $derived.by(() => {
    const allPlots = Object.values(plots)
    if (!allPlots.length) return []

    const combinedData = allPlots.flatMap((plot, plotIndex) =>
      plot.data.map((point, index) => ({
        ...point,
        tripId: Object.keys(plots)[plotIndex],
        tripCreationCost: Object.values(trips)[plotIndex]?.tripCreationCost || 0
      }))
    )

    // Sort by time
    combinedData.sort((a, b) => a.time - b.time)

    // Find the earliest time
    const earliestTime = combinedData.length > 0 ? combinedData[0].time : Date.now()

    // Add initial 0 point at the start
    const dataWithBaseline = [
      {
        time: earliestTime - 1000, // 1 second before first event
        value: 0,
        valueChange: 0,
        eventType: "baseline",
        meta: {}
      },
      ...combinedData
    ]

    // Now accumulate the value changes globally and add index
    let runningBalance = 0
    return dataWithBaseline.map((point, index) => {
      runningBalance += point.valueChange || 0
      return {
        ...point,
        index,
        value: runningBalance
      }
    })
  })

  $effect(() => {
    graphData = allData
  })

  // Limited version of allData for display
  let limitedData = $derived([...allData].slice(-limit, allData.length))

  let profitLossOverTime = $derived.by(() => {
    if (!limitedData.length) return []

    // The P/L is already calculated in allData.value from accumulating valueChanges
    return limitedData.map((point, i) => ({
      time: i,
      index: point.index,
      value: point.value, // Use the already accumulated value
      tripId: point.tripId,
      eventType: point.eventType,
      meta: point.meta
    }))
  })

  const generateTooltipContent = (point: PlotPoint) => {
    const mapping = {
      trip_created: "Created trip",
      trip_liquidated: "Liquidated trip",
      trip_death: "Rat died",
      trip_visit: "Rat visited",
      unknown: ""
    }
    const eventType = point.eventType || "unknown"
    const eventTypeLabel = mapping[eventType]

    let toolTipContent = `<div><strong>${eventTypeLabel}</strong><br/>`

    const valueChangeClass = point.value
      ? point.value > 0
        ? "tooltip-value-positive"
        : "tooltip-value-negative"
      : "tooltip-value"
    let explicitSymbol =
      valueChangeClass === "tooltip-value" ? "" : valueChangeClass.includes("positive") ? "+" : "-"
    toolTipContent += `P/L: <span class="${valueChangeClass}">${explicitSymbol}${CURRENCY_SYMBOL}${Math.abs(point.value || 0)}</span></div>`

    return toolTipContent
  }

  const toggleSource = () => {
    if (limit === 50 && allData.length > 50) {
      limit = allData.length
    } else {
      limit = 50
    }
    // TOggle the data source used
  }

  // Setup real-time updates
  onMount(() => {
    backgroundMusic = playSound("ratfunMusic", "admin", true)
    const interval = setInterval(() => {
      currentTime = Date.now()
    }, 1000)

    return () => clearInterval(interval)
  })

  onDestroy(() => {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
    }
  })
</script>

<div class="profit-loss-graph">
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
      <div class="legend y">
        <button class="active">Profit/Loss</button>
      </div>
      <div class="legend x">
        <button onclick={toggleSource} class="time-option" class:active={timeWindow === "events"}
          >{#if limitedData.length === allData.length}All&nbsp;
          {/if}events ({#if limitedData.length < allData.length}{limitedData.length}/{allData.length}{:else}{limitedData.length}{/if})
        </button>
      </div>
      <svg {width} {height}>
        {#if profitLossOverTime.length > 0}
          <g transform="translate({padding.left}, {padding.top})">
            <!-- Zero line for reference -->
            <line
              x1="0"
              y1={yScale(0)}
              x2={innerWidth}
              y2={yScale(0)}
              stroke="var(--color-grey-mid)"
              stroke-width="2"
              stroke-dasharray="4,4"
            />

            <!-- Cumulative profit/loss line -->
            <path
              d={line()
                .x(d => xScale(d.time))
                .y(d => yScale(d.value))(profitLossOverTime)}
              stroke="var(--color-grey-light)"
              stroke-width={2}
              fill="none"
            />

            {#each profitLossOverTime as point, i (point.time)}
              <!-- If the candle is selected, draw a line through it -->
              {#if $focusEvent === point.index}
                <line
                  x1={xScale(point.time)}
                  y1={0}
                  x2={xScale(point.time)}
                  y2={height}
                  stroke="var(--color-grey-mid)"
                  stroke-width="2"
                  stroke-dasharray="4,4"
                />
              {/if}

              {@const lastPoint = profitLossOverTime?.[i - 1]}
              <g
                onpointerenter={() => {
                  $focusEvent = point.index
                }}
                onpointerleave={() => ($focusEvent = -1)}
                data-tippy-content={generateTooltipContent(point)}
              >
                {#if point.eventType === "trip_death"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId || $focusEvent === point.index ? "white" : ""}
                    stroke-width="2"
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else if point.eventType === "trip_liquidated"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId || $focusEvent === point.index ? "white" : ""}
                    stroke-width="2"
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else if point.eventType === "trip_created"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId || $focusEvent === point.index ? "white" : ""}
                    stroke-width="2"
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId || $focusEvent === point.index ? "white" : ""}
                    stroke-width="2"
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {/if}
                {#if lastPoint}
                  {@const candleHeight = Math.abs(yScale(point.value) - yScale(lastPoint.value))}
                  {@const candleWidth = innerWidth / 80}
                  <!-- Draw "candle" -->
                  {#if point.eventType === "trip_death" || point.eventType === "trip_visit"}
                    <rect
                      x={xScale(point.time) - candleWidth / 2}
                      y={point.value < lastPoint.value
                        ? yScale(lastPoint.value)
                        : yScale(lastPoint.value) - candleHeight}
                      width={candleWidth}
                      height={candleHeight}
                      stroke={focus === point.tripId || $focusEvent === point.index ? "white" : ""}
                      stroke-width="2"
                      fill={point.value < lastPoint.value
                        ? "var(--graph-color-down)"
                        : "var(--graph-color-up)"}
                    >
                    </rect>
                  {/if}
                {/if}
              </g>
            {/each}
          </g>
        {/if}
      </svg>
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

  .legend {
    position: absolute;
    z-index: 999;
    display: flex;
    gap: 8px;
    padding: 8px;

    &.y {
      top: 0;
      left: 0;
    }

    &.x {
      bottom: 0;
      right: 0;
    }
    button {
      border: none;

      &.time-option {
        &.active {
          background: black;
          color: white;
        }
      }

      &:not(.active) {
        background: var(--color-grey-light);
        color: var(--color-grey-dark);
      }
    }
  }

  .profit-loss-graph {
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
