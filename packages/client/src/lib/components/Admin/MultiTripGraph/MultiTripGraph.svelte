<script lang="ts">
  import type { PlotPoint } from "$lib/components/Room/RoomGraph/types"

  import { onMount, onDestroy } from "svelte"

  import { playSound } from "$lib/modules/sound"

  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { truncateString, blockNumberToTimestamp } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { blockNumber } from "$lib/modules/network"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, focus, height = 400, graphData = $bindable() } = $props()

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  let backgroundMusic: Howl | undefined = $state()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let limit = $state(50)
  let timeWindow = $state<"1m" | "1h" | "1d" | "1w" | "all_time" | "events">("events")

  const padding = { top: 0, right: 0, bottom: 0, left: 0 }

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

  /** All plots for the rooms */
  let plots: Record<string, { data: PlotPoint[]; line: any }> = $derived.by(() => {
    const result = Object.fromEntries(
      Object.entries(trips).map(([tripId, trip]) => {
        let sanityRoomContent = $staticContent?.rooms?.find(r => r.title == tripId)

        const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == tripId) || []

        // Sort the outcomes in order of creation
        outcomes.sort((a, b) => {
          return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
        })

        const roomOutcomes = outcomes.reverse()
        const initialTime = new Date(sanityRoomContent?._createdAt).getTime()

        // Build the data array with initial point and outcomes
        const dataPoints = [
          {
            time: initialTime,
            roomValue: Number(trip.roomCreationCost),
            meta: sanityRoomContent,
            _createdAt: sanityRoomContent?._createdAt,
            eventType: "trip_created"
          },
          ...roomOutcomes.map(outcome => ({
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

          // Get the last value before liquidation to calculate the change
          const lastValue = dataPoints[dataPoints.length - 1]?.roomValue || 0

          dataPoints.push({
            _createdAt: new Date(liquidationTime).toISOString(),
            roomValue: Number(trip.liquidationValue),
            roomValueChange: Number(trip.liquidationValue) - lastValue,
            liquidationBlock: trip.liquidationBlock,
            prompt: "Liquidation",
            eventType: "trip_liquidated"
          })
        }

        const data = dataPoints.map((o, i) => {
          const time = new Date(o?._createdAt).getTime()
          return {
            time: time || o.time,
            value: o?.roomValue || 0,
            eventType: o.eventType,
            meta: { ...sanityRoomContent, ...o }
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
  let isEmpty = $derived(Object.values(plots).every(plot => plot.length === 0))

  // Calculate total investment and current balance
  let totalInvestment = $derived(
    Object.values(trips).reduce((sum, trip) => sum + Number(trip.roomCreationCost || 0), 0)
  )

  let totalBalance = $derived(
    Object.values(trips).reduce((sum, trip) => sum + Number(trip.balance || 0), 0)
  )

  // Combine all data points from all trips and sort by time (used across multiple derived values)
  let allData = $derived.by(() => {
    const allPlots = Object.values(plots)
    if (!allPlots.length) return []

    const data = allPlots.flatMap((plot, plotIndex) =>
      plot.data.map(point => ({
        ...point,
        tripId: Object.keys(plots)[plotIndex],
        roomCreationCost: Object.values(trips)[plotIndex]?.roomCreationCost || 0
      }))
    )

    // Sort by time
    data.sort((a, b) => a.time - b.time)
    return data
  })

  $effect(() => {
    graphData = allData
  })

  // Limited version of allData for display
  let limitedData = $derived([...allData].slice(-limit, allData.length))

  let profitLossOverTime = $derived.by(() => {
    if (!limitedData.length) return []

    // Calculate cumulative profit/loss over time: balance - investment
    const profitLossData = []
    const tripIds = Object.keys(plots)

    limitedData.forEach((point, i) => {
      // Find the current balance for each trip at this point in time
      const currentBalance = tripIds.reduce((totalBalance, tripId) => {
        const plot = plots[tripId]
        const relevantPoints = plot.data.filter(p => p.time <= point.time)
        const latestPoint = relevantPoints[relevantPoints.length - 1]
        return totalBalance + (latestPoint?.value || 0)
      }, 0)

      // Current investment at this point in time
      const currentInvestment = tripIds.reduce((totalInvestment, tripId) => {
        const plot = plots[tripId]
        const hasStarted = plot.data.some(p => p.time <= point.time)
        if (hasStarted) {
          const trip = trips[tripId]
          return totalInvestment + Number(trip?.roomCreationCost || 0)
        }
        return totalInvestment
      }, 0)

      const profitLoss = currentBalance - currentInvestment

      profitLossData.push({
        time: i,
        value: profitLoss,
        tripId: point.tripId,
        eventType: point.eventType,
        meta: { ...point.meta, balance: currentBalance, investment: currentInvestment }
      })
    })

    return profitLossData
  })

  const generateTooltipContent = (point: PlotPoint) => {
    const mapping = {
      trip_created: "Created trip",
      trip_liquidated: "Liquidated trip",
      trip_death: "Rat died",
      trip_visit: "Rat visited",
      unknown: ""
    }
    const eventType = point.meta?.eventType || "unknown"
    const eventTypeLabel = mapping[eventType]

    let toolTipContent = `<div><strong>${eventTypeLabel}</strong><br/>`

    const valueChangeClass = point.meta?.roomValueChange
      ? point.meta?.roomValueChange > 0
        ? "tooltip-value-positive"
        : "tooltip-value-negative"
      : "tooltip-value"
    let explicitSymbol =
      valueChangeClass === "tooltip-value" ? "" : valueChangeClass.includes("positive") ? "+" : "-"
    toolTipContent += `P/L: <span class="${valueChangeClass}">${explicitSymbol}${CURRENCY_SYMBOL}${Math.abs(point.meta?.roomValueChange || 0)}</span></div>`

    return toolTipContent
  }

  const toggleSource = () => {
    console.log("TOGGLE SOURCE")
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
              stroke-width="1"
              stroke-dasharray="2,2"
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
              {@const lastPoint = profitLossOverTime?.[i - 1]}
              <g data-tippy-content={generateTooltipContent(point)}>
                {#if point.eventType === "trip_death"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId ? "white" : ""}
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else if point.eventType === "trip_liquidated"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId ? "white" : ""}
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else if point.eventType === "trip_created"}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId ? "white" : ""}
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {:else}
                  <circle
                    fill="var(--color-grey-light)"
                    stroke={focus === point.tripId ? "white" : ""}
                    r="5"
                    cx={xScale(point.time)}
                    cy={yScale(point.value)}
                  ></circle>
                {/if}
                {#if lastPoint}
                  {@const candleHeight = Math.abs(yScale(point.value) - yScale(lastPoint.value))}
                  {@const candleWidth = innerWidth / 80}
                  <!-- Draw "candle" -->
                  <rect
                    x={xScale(point.time) - candleWidth / 2}
                    y={point.value < lastPoint.value
                      ? yScale(lastPoint.value)
                      : yScale(lastPoint.value) - candleHeight}
                    width={candleWidth}
                    height={candleHeight}
                    stroke={focus === point.tripId ? "white" : ""}
                    fill={point.value < lastPoint.value
                      ? "var(--graph-color-down)"
                      : "var(--graph-color-up)"}
                  >
                  </rect>
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
