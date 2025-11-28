<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { onMount } from "svelte"
  import { Tooltip } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { staticContent } from "$lib/modules/content"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import { calculateProfitLossForTrip } from "../../helpers"
  import { focusEvent, selectedEvent } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    trip,
    tripId,
    height = 400,
    behavior = "hover",
    data = $bindable([]),
    focusEventOverride = undefined,
    selectedEventOverride = undefined,
    onFocusChange = undefined,
    onSelectionChange = undefined
  }: {
    trip: Trip
    tripId: string
    height?: number
    behavior?: "hover" | "click"
    data?: TripEvent[]
    focusEventOverride?: number
    selectedEventOverride?: number
    onFocusChange?: (index: number) => void
    onSelectionChange?: (index: number) => void
  } = $props()

  // Use override values if provided, otherwise use global stores
  let effectiveFocusEvent = $derived(
    focusEventOverride !== undefined ? focusEventOverride : $focusEvent
  )
  let effectiveSelectedEvent = $derived(
    selectedEventOverride !== undefined ? selectedEventOverride : $selectedEvent
  )

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let limit = $state(50)

  const padding = { top: 0, right: 12, bottom: 0, left: 12 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    if (!allData.length || !innerWidth) return scaleTime()

    const domainStart = 0
    const domainEnd = Math.min(limit - 1, allData.length - 1)

    return scaleLinear().domain([domainStart, domainEnd]).range([0, innerWidth])
  })

  let yScale = $derived.by(() => {
    if (!allData.length || !innerHeight) return scaleLinear()

    let yScaleData, maxValue, minValue

    yScaleData = [...profitLossOverTime]

    maxValue = Number(max(yScaleData, (d: TripEvent) => +d.value) ?? 0)
    minValue = Number(min(yScaleData, (d: TripEvent) => +d.value) ?? 0)

    // Ensure 0 is always included in the domain
    maxValue = Math.max(maxValue, 0)
    minValue = Math.min(minValue, 0)

    const fraction = (maxValue - minValue) / 9

    return scaleLinear()
      .domain([minValue - fraction, maxValue + fraction])
      .range([innerHeight, 0])
  })

  /** Plotting data for the single trip */
  let tripEventData = $derived.by(() => {
    const sanityTripContent = $staticContent?.trips?.find(r => r._id == tripId)

    if (!sanityTripContent) {
      return []
    }

    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    return calculateProfitLossForTrip(trip, tripId, sanityTripContent, outcomes)
  })

  let isEmpty = $derived(tripEventData.length === 0)

  // Accumulate value changes for the single trip
  let allData = $derived.by(() => {
    if (!tripEventData.length) return []

    // Accumulate the value changes and add index
    let runningBalance = 0
    return tripEventData.map((point, index) => {
      runningBalance += point.valueChange || 0
      return {
        ...point,
        index,
        tripId,
        tripCreationCost: Number(trip.tripCreationCost),
        value: runningBalance
      }
    })
  })

  // Sync allData with bindable prop
  $effect(() => {
    data = allData
  })

  // Limited version of allData for display
  let limitedData = $derived([...allData].slice(-limit, allData.length))

  let profitLossOverTime = $derived.by(() => {
    if (!limitedData.length) return []

    // The P/L is already calculated in allData.value from accumulating valueChanges
    return limitedData.map((point, i) => ({
      ...point,
      time: i,
      value: point.value // Use the already accumulated value
    }))
  })

  const generateTooltipContent = (point: TripEvent) => {
    const mapping: Record<string, string> = {
      [TRIP_EVENT_TYPE.BASELINE]: "Baseline",
      [TRIP_EVENT_TYPE.CREATION]: "Created trip",
      [TRIP_EVENT_TYPE.LIQUIDATION]: "Liquidated trip",
      [TRIP_EVENT_TYPE.DEATH]: "Rat died",
      [TRIP_EVENT_TYPE.VISIT]: "Rat visited",
      [TRIP_EVENT_TYPE.DEPLETED]: "Trip depleted",
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
    toolTipContent += `P/L: <span class="${valueChangeClass}">${explicitSymbol}${Math.abs(point.value || 0)} ${CURRENCY_SYMBOL}</span></div>`

    return toolTipContent
  }

  const toggleSource = () => {
    if (limit === 50 && allData.length > 50) {
      limit = allData.length
    } else {
      limit = 50
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

<div class="profit-loss-graph" style:height="{height}px">
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
    <div class="graph" style:height="{height}px" bind:clientWidth={width}>
      <div class="legend y">
        <button class="active">Profit</button>
      </div>
      <div class="legend x">
        <button onclick={toggleSource} class="time-option active"
          >{#if limitedData.length === allData.length}All&nbsp;
          {/if}events ({#if limitedData.length < allData.length}{limitedData.length}/{allData.length}{:else}{limitedData.length}{/if})
        </button>
      </div>
      <svg {width} {height}>
        {#if profitLossOverTime.length > 0}
          <g transform="translate({padding.left}, {padding.top})">
            <!-- Zero line for reference -->
            <line
              id="zero"
              x1="0"
              y1={yScale(0)}
              x2={innerWidth}
              y2={yScale(0)}
              stroke="var(--color-grey-mid)"
              stroke-width={2}
              stroke-dasharray="2,2"
            />

            <!-- Cumulative profit/loss line -->
            <path
              d={line<TripEvent>()
                .x(d => xScale(d.time))
                .y(d => yScale(d.value))(profitLossOverTime)}
              stroke="var(--color-grey-light)"
              stroke-width={2}
              fill="none"
            />

            <!-- Render all non-focused points first -->
            {#each profitLossOverTime.filter(p => p.index !== effectiveFocusEvent) as point, i (point.time)}
              {@const lastPoint = profitLossOverTime?.[profitLossOverTime.indexOf(point) - 1]}

              <Tooltip
                content={generateTooltipContent(point)}
                svg={true}
                props={{ allowHTML: true }}
              >
                <g
                  onpointerdown={() => {}}
                  onpointerup={() => {
                    if (behavior === "click") {
                      if (onFocusChange) {
                        onFocusChange(point.index)
                      } else {
                        $focusEvent = point.index
                      }
                      if (onSelectionChange) {
                        onSelectionChange(point.index)
                      } else {
                        $selectedEvent = point.index
                      }
                    }
                  }}
                  onpointerenter={() => {
                    if (behavior === "hover") {
                      if (onFocusChange) {
                        onFocusChange(point.index)
                      } else {
                        $focusEvent = point.index
                      }
                    }
                  }}
                  onpointerleave={() => {
                    if (behavior === "hover") {
                      if (onFocusChange) {
                        onFocusChange(-1)
                      } else {
                        $focusEvent = -1
                      }
                    }
                  }}
                >
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
                        fill={point.value < lastPoint.value
                          ? "var(--color-down)"
                          : "var(--color-up)"}
                      >
                      </rect>
                    {/if}
                  {/if}
                  {#if point.eventType === "trip_death"}
                    <circle
                      fill="var(--color-grey-light)"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point.eventType === "trip_liquidated"}
                    <circle
                      fill="var(--color-grey-light)"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point.eventType === "trip_created"}
                    <circle
                      fill="var(--color-grey-light)"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else}
                    <circle
                      fill="var(--color-grey-light)"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {/if}
                </g>
              </Tooltip>
            {/each}

            <!-- Render focused point on top -->
            {#if effectiveFocusEvent !== -1}
              {@const focusedPoint = profitLossOverTime.find(p => p.index === effectiveFocusEvent)}
              {#if focusedPoint}
                {@const focusedIndex = profitLossOverTime.indexOf(focusedPoint)}
                {@const lastPoint = profitLossOverTime?.[focusedIndex - 1]}

                <line
                  x1={xScale(focusedPoint.time)}
                  y1={0}
                  x2={xScale(focusedPoint.time)}
                  y2={height}
                  stroke="var(--color-grey-mid)"
                  stroke-width="2"
                  stroke-dasharray="4,4"
                />

                <Tooltip
                  content={generateTooltipContent(focusedPoint)}
                  svg={true}
                  props={{ allowHTML: true }}
                >
                  <g
                    onpointerdown={() => {}}
                    onpointerup={() => {
                      if (behavior === "click") {
                        if (onFocusChange) {
                          onFocusChange(focusedPoint.index)
                        } else {
                          $focusEvent = focusedPoint.index
                        }
                        if (onSelectionChange) {
                          onSelectionChange(focusedPoint.index)
                        } else {
                          $selectedEvent = focusedPoint.index
                        }
                      }
                    }}
                    onpointerenter={() => {
                      if (behavior === "hover") {
                        if (onFocusChange) {
                          onFocusChange(focusedPoint.index)
                        } else {
                          $focusEvent = focusedPoint.index
                        }
                      }
                    }}
                    onpointerleave={() => {
                      if (behavior === "hover") {
                        if (onFocusChange) {
                          onFocusChange(-1)
                        } else {
                          $focusEvent = -1
                        }
                      }
                    }}
                  >
                    {#if lastPoint}
                      {@const candleHeight = Math.abs(
                        yScale(focusedPoint.value) - yScale(lastPoint.value)
                      )}
                      {@const candleWidth = innerWidth / 80}
                      <!-- Draw "candle" -->
                      {#if focusedPoint.eventType === "trip_death" || focusedPoint.eventType === "trip_visit"}
                        <rect
                          x={xScale(focusedPoint.time) - candleWidth / 2}
                          y={focusedPoint.value < lastPoint.value
                            ? yScale(lastPoint.value)
                            : yScale(lastPoint.value) - candleHeight}
                          width={candleWidth}
                          height={candleHeight}
                          stroke="white"
                          stroke-width="2"
                          fill={focusedPoint.value < lastPoint.value
                            ? "var(--color-down)"
                            : "var(--color-up)"}
                        >
                        </rect>
                      {/if}
                    {/if}
                    {#if focusedPoint.eventType === "trip_death"}
                      <circle
                        fill="var(--color-grey-light)"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else if focusedPoint.eventType === "trip_liquidated"}
                      <circle
                        fill="var(--color-grey-light)"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else if focusedPoint.eventType === "trip_created"}
                      <circle
                        fill="var(--color-grey-light)"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else}
                      <circle
                        fill="var(--color-grey-light)"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {/if}
                  </g>
                </Tooltip>
              {/if}
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
    z-index: var(--z-top);
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
    // border-right: 1px solid var(--color-grey-mid);
    width: 30px;
    height: 100%;
    position: absolute;
  }

  .x-axis {
    // border-bottom: 1px solid var(--color-grey-mid);
    width: 100%;
    height: 30px;
    position: absolute;
    bottom: 0;
    z-index: var(--z-base);
  }

  .graph {
    width: 100%;
    right: 0;
    top: 0;
    position: absolute;
  }
</style>
