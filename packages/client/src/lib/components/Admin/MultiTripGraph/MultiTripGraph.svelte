<script lang="ts">
  import type { PlotPoint } from "$lib/components/Room/RoomGraph/types"

  import { onMount, onDestroy } from "svelte"

  import { playSound } from "$lib/modules/sound-classic"

  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { truncateString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, focus, height = 400 } = $props()

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  let backgroundMusic: Howl | undefined = $state()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let graph = $state<"trips" | "profitloss">("profitloss")
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

    if (graph === "profitloss") {
      yScaleData = [...profitLossOverTime]

      // Include focused trip data if available
      if (focus && plots[focus]) {
        const focusedPlot = plots[focus]
        const initialCost = focusedPlot.data[0]?.value || 0
        const focusedProfitLoss = focusedPlot.data.map(point => ({
          time: point.time,
          value: point.value - initialCost,
          meta: point.meta
        }))
        yScaleData.push(...focusedProfitLoss)
      }

      maxValue = Number(max(yScaleData, (d: PlotPoint) => +d.value) ?? 0)
      minValue = Number(min(yScaleData, (d: PlotPoint) => +d.value) ?? 0)

      // Ensure 0 is included and create symmetric range around 0
      const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue))
      maxValue = Math.max(maxAbsValue, 1) // Minimum range of 1
      minValue = -maxValue // Symmetric range
    } else {
      yScaleData = limitedData
      maxValue = Number(max(yScaleData, (d: PlotPoint) => +d.value) ?? 0)
      minValue = 0
    }

    return scaleLinear().domain([minValue, maxValue]).range([innerHeight, 0])
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
        const data = [
          {
            time: initialTime,
            roomValue: Number(trip.roomCreationCost),
            meta: sanityRoomContent
          },
          ...roomOutcomes
        ].map((o, i) => {
          const time = new Date(o?._createdAt).getTime()
          return {
            time: time || o.time,
            value: o?.roomValue || 0,
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

  let currentProfitLoss = $derived(totalBalance - totalInvestment)

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
        meta: { ...point.meta, balance: currentBalance, investment: currentInvestment }
      })
    })

    return profitLossData
  })

  const generateTooltipContent = (point: PlotPoint) => {
    if (graph === "profitloss") {
      const balance = point.meta?.balance || 0
      const investment = point.meta?.investment || 0
      return `<div>Balance: <span class="tooltip-value">${CURRENCY_SYMBOL}${balance.toFixed(2)}</span><br/>Investment: <span class="tooltip-value">${CURRENCY_SYMBOL}${investment.toFixed(2)}</span><br/>P/L: <span class="tooltip-value ${point.value >= 0 ? "tooltip-value-positive" : "tooltip-value-negative"}">${CURRENCY_SYMBOL}${point.value.toFixed(2)}</span></div>`
    } else {
      let toolTipContent = `<div>${truncateString(point.meta.prompt, 32)}<br>balance: <span class="tooltip-value">${CURRENCY_SYMBOL}${point?.value}</span>`

      if (point?.meta?.roomValueChange) {
        const valueChangeClass =
          point.meta.roomValueChange > 0 ? "tooltip-value-positive" : "tooltip-value-negative"
        toolTipContent += `<br/>Change: <span class="${valueChangeClass}">${point.meta.roomValueChange}</span></div>`
      }

      return toolTipContent
    }
  }

  // Setup real-time updates
  onMount(() => {
    backgroundMusic = playSound("ratfun", "admin", true)
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
        <!-- <button onclick={() => (graph = "trips")} class:active={graph === "trips"}>Trips </button> -->
        <button onclick={() => (graph = "profitloss")} class:active={graph === "profitloss"}
          >Profit/Loss
        </button>
      </div>
      <div class="legend x">
        <!-- Time window options -->
        <button
          class="time-option"
          onclick={() => (timeWindow = "1m")}
          class:active={timeWindow === "1m"}
          >minute
        </button>
        <button
          class="time-option"
          onclick={() => (timeWindow = "1h")}
          class:active={timeWindow === "1h"}
          >hour
        </button>
        <button
          class="time-option"
          onclick={() => (timeWindow = "1d")}
          class:active={timeWindow === "1d"}
          >day
        </button>
        <button
          class="time-option"
          onclick={() => (timeWindow = "1w")}
          class:active={timeWindow === "1w"}
          >week
        </button>
        <button
          class="time-option"
          onclick={() => (timeWindow = "all_time")}
          class:active={timeWindow === "all_time"}
          >All-time
        </button>
        <button
          class="time-option"
          onclick={() => (timeWindow = "events")}
          class:active={timeWindow === "events"}
          >Recent events
        </button>
      </div>
      <svg {width} {height}>
        {#if graph === "trips"}
          {#each Object.entries(plots) as [tripId, plot]}
            {#if plot.data && width}
              <g transform="translate({padding.left}, {padding.top})">
                <path
                  d={plot.line(plot.data)}
                  stroke={focus === tripId ? "white" : "var(--color-grey-light)"}
                  stroke-width={2}
                  stroke-dasharray={4}
                  fill="none"
                />

                {#each plot.data as point (point.time)}
                  <g data-tippy-content={generateTooltipContent(point)}>
                    {#if !point?.meta?.roomValueChange || point?.meta?.roomValueChange === 0}
                      <circle
                        fill={focus === tripId ? "white" : "var(--color-grey-light)"}
                        r="5"
                        cx={xScale(point.time)}
                        cy={yScale(point.value)}
                      ></circle>
                    {:else if point?.meta?.roomValueChange > 0}
                      <polygon
                        transform="translate({xScale(point.time)}, {yScale(
                          point.value
                        )}) scale(2, 3)"
                        fill="var(--color-value-up)"
                        points="-5 2.5, 0 -5, 5 2.5"
                      />
                    {:else}
                      <polygon
                        transform="translate({xScale(point.time)}, {yScale(
                          point.value
                        )}) scale(2, 3)"
                        fill="var(--color-value-down)"
                        points="-5 -2.5, 0 5, 5 -2.5"
                      />
                    {/if}
                  </g>
                {/each}
              </g>
            {/if}
          {/each}
        {:else if graph === "profitloss" && profitLossOverTime.length > 0}
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

            {#each profitLossOverTime as point (point.time)}
              <circle
                fill="var(--color-grey-light)"
                r="5"
                cx={xScale(point.time)}
                cy={yScale(point.value)}
                data-tippy-content={generateTooltipContent(point)}
              ></circle>
            {/each}

            <!-- Focused trip profit/loss line -->
            {#if focus && plots[focus]}
              {@const focusedPlot = plots[focus]}
              {@const initialCost = focusedPlot.data[0]?.value || 0}
              {@const focusedProfitLoss = focusedPlot.data.map(point => ({
                time: point.time,
                value: point.value - initialCost,
                meta: point.meta
              }))}

              <path
                d={line()
                  .x(d => xScale(d.time))
                  .y(d => yScale(d.value))(focusedProfitLoss)}
                stroke="white"
                stroke-width={3}
                fill="none"
              />

              {#each focusedProfitLoss as point (point.time)}
                <circle
                  fill={point.value >= 0 ? "var(--color-value-up)" : "var(--color-value-down)"}
                  r="5"
                  cx={xScale(point.time)}
                  cy={yScale(point.value)}
                  data-tippy-content={`${focus} Profit/Loss: ${CURRENCY_SYMBOL}${point.value.toFixed(2)}`}
                ></circle>
              {/each}
            {/if}
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
    // z-index: 999;
    display: flex;
    gap: 8px;
    padding: 8px;
    pointer-events: none;

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
        &:not(.active) {
          background: black;
          text: white;
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
