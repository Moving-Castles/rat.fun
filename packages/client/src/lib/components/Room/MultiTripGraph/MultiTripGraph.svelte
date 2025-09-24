<script lang="ts">
  import type { PlotPoint } from "../RoomGraph/types"

  import { truncateString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"
  import { onMount } from "svelte"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, focus, height = 400 } = $props()

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let graph = $state<"trips" | "profitloss">("profitloss")
  let timeWindow = $state<"1m" | "1h" | "1d" | "1w" | "all_time">("all_time")

  const padding = { top: 6, right: 12, bottom: 6, left: 6 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots.length || !innerWidth) return scaleTime()

    const allData = allPlots.flatMap(plot => plot.data)

    if (!allData.length) return scaleTime()

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
        default:
          return Number(min(allData, (d: PlotPoint) => d.time))
      }
    }

    const domainStart = new Date(getRelevantDomainStart())
    const domainEnd = new Date(currentTime) // Always go to current time

    return scaleTime().domain([domainStart, domainEnd]).range([0, innerWidth])
  })
  let yScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots.length || !innerHeight) return scaleLinear()

    let allData, maxValue, minValue

    if (graph === "profitloss") {
      allData = [...profitLossOverTime]

      // Include focused trip data if available
      if (focus && plots[focus]) {
        const focusedPlot = plots[focus]
        const initialCost = focusedPlot.data[0]?.value || 0
        const focusedProfitLoss = focusedPlot.data.map(point => ({
          time: point.time,
          value: point.value - initialCost,
          meta: point.meta
        }))
        allData.push(...focusedProfitLoss)
      }

      maxValue = Number(max(allData, (d: PlotPoint) => +d.value) ?? 0)
      minValue = Number(min(allData, (d: PlotPoint) => +d.value) ?? 0)

      // Ensure 0 is included and create symmetric range around 0
      const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue))
      maxValue = Math.max(maxAbsValue, 1) // Minimum range of 1
      minValue = -maxValue // Symmetric range
    } else {
      allData = allPlots.flatMap(plot => plot.data)
      maxValue = Number(max(allData, (d: PlotPoint) => +d.value) ?? 0)
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

  let profitLossOverTime = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots.length) return []

    // Combine all data points from all trips and sort by time
    const allData = allPlots.flatMap((plot, plotIndex) =>
      plot.data.map(point => ({
        ...point,
        tripId: Object.keys(plots)[plotIndex],
        roomCreationCost: Object.values(trips)[plotIndex]?.roomCreationCost || 0
      }))
    )

    // Sort by time
    allData.sort((a, b) => a.time - b.time)

    // Calculate cumulative profit/loss over time: balance - investment
    const profitLossData = []

    allData.forEach(point => {
      // Find the current balance for each trip at this point in time
      const currentBalance = Object.entries(plots).reduce((totalBalance, [tripId, plot]) => {
        const relevantPoints = plot.data.filter(p => p.time <= point.time)
        const latestPoint = relevantPoints[relevantPoints.length - 1]
        return totalBalance + (latestPoint?.value || 0)
      }, 0)

      // Current investment at this point in time
      const currentInvestment = Object.entries(plots).reduce((totalInvestment, [tripId, plot]) => {
        const hasStarted = plot.data.some(p => p.time <= point.time)
        if (hasStarted) {
          const tripData = Object.values(trips).find(t => Object.keys(trips).indexOf(tripId) >= 0)
          return totalInvestment + Number(tripData?.roomCreationCost || 0)
        }
        return totalInvestment
      }, 0)

      const profitLoss = currentBalance - currentInvestment

      profitLossData.push({
        time: point.time,
        value: profitLoss,
        meta: { ...point.meta, balance: currentBalance, investment: currentInvestment }
      })
    })

    // Add current point if we have trips
    if (profitLossData.length > 0) {
      profitLossData.push({
        time: currentTime,
        value: currentProfitLoss,
        meta: { balance: totalBalance, investment: totalInvestment }
      })
    }

    return profitLossData
  })

  $inspect(profitLossOverTime)

  const generateTooltipContent = (point: PlotPoint) => {
    if (graph === "profitloss") {
      const balance = point.meta?.balance || 0
      const investment = point.meta?.investment || 0
      return `<div>Balance: <span class="tooltip-value">$${balance.toFixed(2)}</span><br/>Investment: <span class="tooltip-value">$${investment.toFixed(2)}</span><br/>P/L: <span class="tooltip-value ${point.value >= 0 ? "tooltip-value-positive" : "tooltip-value-negative"}">$${point.value.toFixed(2)}</span></div>`
    } else {
      let toolTipContent = `<div>${truncateString(point.meta.prompt, 32)}<br>balance: <span class="tooltip-value">$${point?.value}</span>`

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
    const interval = setInterval(() => {
      currentTime = Date.now()
    }, 1000)

    return () => clearInterval(interval)
  })
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
                data-tippy-content={`Total Profit/Loss: $${point.value.toFixed(2)}`}
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
                  data-tippy-content={`${focus} Profit/Loss: $${point.value.toFixed(2)}`}
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
