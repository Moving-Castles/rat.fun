<script lang="ts">
  import type { PlotPoint } from "../RoomGraph/types"

  import { truncateString } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"
  import { onMount, onDestroy } from "svelte"

  import "tippy.js/dist/tippy.css" // optional for styling

  let { trips, focus, height = 400 }: { trips: Room[]; focus: string; height: number } = $props()

  // State
  let graph = $state<"trips" | "profitloss">("profitloss")
  let interval = $state<ReturnType<typeof setTimeout>>()
  let timeWindow = $state<"1m" | "1h" | "1d" | "1w" | "all_time" | "event_based">("event_based")
  let currentTime = $state(Date.now())

  // Layout
  const padding = { top: 6, right: 12, bottom: 6, left: 6 }
  let width = $state(0) // width will be set by the clientWidth
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xDomainStart = $derived.by(() => {
    if (!allData.length) return 0

    switch (timeWindow) {
      case "1m":
        return new Date(currentTime - 1000 * 60)
      case "1h":
        return new Date(currentTime - 1000 * 60 * 60)
      case "1d":
        return new Date(currentTime - 1000 * 60 * 60 * 24)
      case "1w":
        return new Date(currentTime - 1000 * 60 * 60 * 24 * 7)
      case "all_time":
        return new Date(Number(min(allData, (d: PlotPoint) => d.time)))
      default:
        return 0
    }
  })
  let xDomainEnd = $derived.by(() => {
    if (!allData.length) return 0

    return timeWindow === "event_based" ? allData.length : new Date(currentTime)
  })

  let allData = $derived.by(() => {
    return Object.keys(trips)
      .map(key => {
        const sanityRoomContent = $staticContent?.rooms?.find(r => r.title == key)
        const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == key) || []
        return [sanityRoomContent, ...outcomes]
      })
      .flat()
      .sort((a, b) => new Date(a?._createdAt).getTime() - new Date(b?._createdAt).getTime())
      .map((data, i) => ({
        ...data,
        index: i
      }))
  })
  let timestamps = $derived(allData.map(datum => new Date(datum._createdAt).getTime()))

  $inspect(allData)
  $inspect(timestamps)

  /*             */
  /*   X SCALE   */
  /*             */
  let xScale = $derived.by(() => {
    console.log("making scales ", xDomainStart, xDomainEnd)
    return scaleLinear().domain([xDomainStart, xDomainEnd]).range([0, innerWidth])
  })

  /*           */
  /*  Y SCALE  */
  /*           */
  let yScale = $derived.by(() => {
    const maxValue = Number(max(allData, (d: PlotPoint) => +d.value) ?? 0)
    const minValue = 0

    return scaleLinear().domain([minValue, maxValue]).range([innerHeight, 0])
  })

  let isEmpty = $derived(allData.length === 0)

  // Calculate total investment and current balance
  let totalInvestment = $derived(
    Object.values(trips).reduce(
      (sum: number, trip: Room) => sum + Number(trip.roomCreationCost || 0),
      0
    )
  )

  let totalBalance = $derived(
    Object.values(trips).reduce((sum, trip) => sum + Number(trip.balance || 0), 0)
  )

  let currentProfitLoss = $derived(totalBalance - totalInvestment)

  let profitLossOverTime = $derived.by(() => {
    // Calculate cumulative profit/loss over time: balance - investment
    const profitLossData = []

    allData.forEach((point, index) => {
      // Calculate cumulative balance up to this point in time
      let currentBalance = 0
      let currentInvestment = 0

      // Go through all data points up to and including the current point
      for (let i = 0; i <= index; i++) {
        const dataPoint = allData[i]

        // If this is a room creation (sanityRoomContent), add to investment
        if (dataPoint.title && !dataPoint.roomId) {
          // This is room content, find the corresponding trip to get investment cost
          const tripKey = dataPoint.title
          const trip = trips[tripKey]
          if (trip) {
            currentInvestment += Number(trip.roomCreationCost || 0)
          }
        }

        // If this is an outcome, it affects the balance
        if (dataPoint.roomId) {
          // This is an outcome, use its value for balance calculation
          currentBalance += Number(dataPoint.value || 0)
        }
      }

      const profitLoss = currentBalance - currentInvestment

      profitLossData.push({
        time: new Date(point._createdAt).getTime(),
        value: profitLoss,
        meta: {
          ...point,
          balance: currentBalance,
          investment: currentInvestment,
          prompt: point.title || point.prompt || 'Event'
        }
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
    interval = setInterval(() => {
      currentTime = Date.now()
    }, 1000)

    tippy("[data-tippy-content]", {
      allowHTML: true
    })
  })
  onDestroy(() => {
    clearInterval(interval)
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
        <!-- <button onclick={() => (graph = "profitloss")} class:active={graph === "profitloss"}
          >Profit/Loss
        </button> -->
      </div>
      <div class="legend x">
        <!-- Time window options -->
        <!-- <button
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
        </button> -->
        <button
          class="time-option"
          onclick={() => (timeWindow = "event_based")}
          class:active={timeWindow === "event_based"}
          >All events
        </button>

        <button inert class="axis-range">
          {xDomainStart}-{xDomainEnd}
        </button>
      </div>

      <!-- <svg {width} {height}>
        {#if graph === "profitloss" && profitLossOverTime.length > 0}
          <g transform="translate({padding.left}, {padding.top})">
            <line
              x1="0"
              y1={yScale(0)}
              x2={innerWidth}
              y2={yScale(0)}
              stroke="var(--color-grey-mid)"
              stroke-width="1"
              stroke-dasharray="2,2"
            />

            <path
              d={line()
                .x(d => xScale(d.time))
                .y(d => yScale(d.value))(profitLossOverTime)}
              stroke="var(--color-grey-light)"
              stroke-width={2}
              fill="none"
            />

            {#each profitLossOverTime as point, i (i)}
              <circle
                fill="var(--color-grey-light)"
                r="5"
                cx={xScale(point.time)}
                cy={yScale(point.value)}
                data-tippy-content={`Total Profit/Loss: $${point.value.toFixed(2)}`}
              ></circle>
            {/each}
          </g>
        {/if}
      </svg> -->
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
