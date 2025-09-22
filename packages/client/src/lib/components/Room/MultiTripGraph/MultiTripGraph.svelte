<script lang="ts">
  import type { PlotPoint } from "../RoomGraph/types"

  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, height = 400 } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth

  const padding = { top: 6, right: 12, bottom: 6, left: 6 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots) return scaleTime() // idk what this returns

    const allData = [...allPlots.map(plot => plot.data)]
    const domainStart = Number(allPlots[0].data[0].time)
    const domainEnd = Number(max(allData, (d: PlotPoint) => d.time))
    const finalDomainEnd =
      domainEnd !== undefined && domainEnd > domainStart ? domainEnd : domainStart + 1 // Add a minimal duration if only one point or max isn't greater

    return scaleTime().domain([domainStart, finalDomainEnd]).range([0, innerWidth])
  })
  let yScale = $derived.by(() => {
    const allPlots = Object.values(plots)

    if (!allPlots) return scaleTime() // idk what this returns

    const allData = [...allPlots.map(plot => plot.data)]

    const maxValue = Number(max(allData, (d: PlotPoint) => +d.value) ?? 0)

    return scaleLinear().domain([0, maxValue]).range([innerHeight, 0]) // Use innerHeight
  })

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
        const data = [
          {
            time: 0,
            roomValue: Number(trip.roomCreationCost),
            meta: sanityRoomContent
          },
          ...roomOutcomes
        ].map((o, i) => {
          return {
            time: i,
            value: o?.roomValue || 0,
            meta: o
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

  const generateTooltipContent = (point: PlotPoint) => {
    let toolTipContent = `<div>Trip balance: <span class="tooltip-value">$${point?.meta?.roomValue}</span>`

    if (point?.meta?.roomValueChange) {
      const valueChangeClass =
        point.meta.roomValueChange > 0 ? "tooltip-value-positive" : "tooltip-value-negative"
      toolTipContent += `<br/>Change: <span class="${valueChangeClass}">${point?.meta?.roomValueChange}</span></div>`
    }

    return toolTipContent
  }

  $inspect(trips)
  $inspect(plots)
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
      <svg {width} {height}>
        {#each Object.values(plots) as plot}
          {#if plot.data && width}
            <g transform="translate({padding.left}, {padding.top})">
              <path
                d={plot.line(plot.data)}
                stroke="var(--color-value)"
                stroke-width={2}
                stroke-dasharray={4}
                fill="none"
              />

              {#each plot.data as point (point.time)}
                <g data-tippy-content={generateTooltipContent(point)}>
                  {#if !point?.meta?.roomValueChange || point?.meta?.roomValueChange === 0}
                    <circle
                      fill="var(--color-value)"
                      r="6"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point?.meta?.roomValueChange > 0}
                    <polygon
                      transform="translate({xScale(point.time)}, {yScale(point.value)}) scale(2, 3)"
                      fill="var(--color-value-up)"
                      points="-5 2.5, 0 -5, 5 2.5"
                    />
                  {:else}
                    <polygon
                      transform="translate({xScale(point.time)}, {yScale(point.value)}) scale(2, 3)"
                      fill="var(--color-value-down)"
                      points="-5 -2.5, 0 5, 5 -2.5"
                    />
                  {/if}
                </g>
              {/each}
            </g>
          {/if}
        {/each}
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
