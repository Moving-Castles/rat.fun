<script lang="ts">
  import type { PlotPoint } from "../RoomGraph/types"

  import { truncateString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, focus, height = 400 } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let graph = $state<"trips" | "profitloss">("trips")

  const padding = { top: 6, right: 12, bottom: 6, left: 6 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots) return scaleLinear() // idk what this returns

    const allData = allPlots.flatMap(plot => plot.data)
    const domainStart = Number(allPlots[0].data[0].time)
    const domainEnd = Number(max(allData, (d: PlotPoint) => d.time))
    const finalDomainEnd =
      domainEnd !== undefined && domainEnd > domainStart ? domainEnd : domainStart + 1 // Add a minimal duration if only one point or max isn't greater

    return scaleLinear().domain([domainStart, finalDomainEnd]).range([0, innerWidth])
  })
  let yScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots) return scaleTime() // idk what this returns

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
      minValue = Math.min(0, ...allData.map(d => +d.value))
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

  let profitLossOverTime = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots.length) return []

    // Combine all data points from all trips and sort by time
    const allData = allPlots.flatMap((plot, plotIndex) =>
      plot.data.map(point => ({
        ...point,
        tripId: Object.keys(plots)[plotIndex],
        initialCost: plot.data[0]?.value || 0
      }))
    )

    // Sort by time
    allData.sort((a, b) => a.time - b.time)

    // Calculate cumulative profit/loss over time
    let cumulativeProfitLoss = 0
    const profitLossData = []

    allData.forEach(point => {
      // Current value minus initial cost for this specific trip
      const tripProfitLoss = point.value - point.initialCost

      // Find the latest value for each trip at this point in time
      const currentTripValues = Object.entries(plots).map(([tripId, plot]) => {
        const relevantPoints = plot.data.filter(p => p.time <= point.time)
        const latestPoint = relevantPoints[relevantPoints.length - 1]
        const initialCost = plot.data[0]?.value || 0
        return latestPoint ? latestPoint.value - initialCost : 0
      })

      // Sum all trip profit/losses at this point in time
      cumulativeProfitLoss = currentTripValues.reduce((sum, val) => sum + val, 0)

      profitLossData.push({
        time: point.time,
        value: cumulativeProfitLoss,
        meta: point.meta
      })
    })

    return profitLossData
  })

  $inspect(profitLossOverTime)

  const generateTooltipContent = (point: PlotPoint) => {
    let toolTipContent = `<div>${truncateString(point.meta.prompt, 32)}<br>balance: <span class="tooltip-value">$${point?.value}</span>`

    if (point?.meta?.roomValueChange) {
      const valueChangeClass =
        point.meta.roomValueChange > 0 ? "tooltip-value-positive" : "tooltip-value-negative"
      toolTipContent += `<br/>Change: <span class="${valueChangeClass}">${point.meta.roomValueChange}</span></div>`
    }

    return toolTipContent
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
      <div class="switch">
        <button onclick={() => (graph = "trips")} class:active={graph === "trips"}>Trips </button>
        <button onclick={() => (graph = "profitloss")} class:active={graph === "profitloss"}
          >Profit/Loss
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
                        r="6"
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
                r="3"
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

  .switch {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 999;
    display: flex;
    gap: 8px;
    padding: 8px;
    button {
      border: none;

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
