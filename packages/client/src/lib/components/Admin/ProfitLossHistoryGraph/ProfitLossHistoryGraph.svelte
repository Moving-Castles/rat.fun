<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import { focusEvent, selectedEvent, focusTrip } from "$lib/modules/ui/state.svelte"
  import { goto } from "$app/navigation"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { page } from "$app/state"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  const handleEventClick = (point: TripEvent) => {
    $focusTrip = point.tripId
    $focusEvent = point.index
    $selectedEvent = point.index
  }

  let {
    graphData,
    height = 400,
    onToggleToLog = undefined
  }: {
    graphData: TripEvent[]
    height: number
    onToggleToLog?: () => void
  } = $props()

  // Add reactive timestamp for real-time updates
  let currentTime = $state(Date.now())

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  let limit = $state(50)
  let timeWindow = $state<"1m" | "1h" | "1d" | "1w" | "all_time" | "events">("events")

  const padding = { top: 0, right: 12, bottom: 0, left: 12 }

  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  let xScale = $derived.by(() => {
    if (!graphData.length || !innerWidth) return scaleTime()

    const domainStart = 0
    const domainEnd =
      timeWindow === "events" ? Math.min(limit - 1, graphData.length - 1) : new Date(currentTime) // Always go to current time

    if (timeWindow === "events") {
      return scaleLinear().domain([domainStart, domainEnd]).range([0, innerWidth])
    } else {
      return scaleTime().domain([domainStart, domainEnd]).range([0, innerWidth])
    }
  })

  let yScale = $derived.by(() => {
    if (!graphData.length || !innerHeight) return scaleLinear()

    let yScaleData, maxValue, minValue

    yScaleData = [...profitLossOverTime]

    maxValue = Number(max(yScaleData, (d: TripEvent) => +d.value) ?? 0)
    minValue = Number(min(yScaleData, (d: TripEvent) => +d.value) ?? 0)

    const fraction = (maxValue - minValue) / 9

    return scaleLinear()
      .domain([minValue - fraction, maxValue + fraction])
      .range([innerHeight, 0])
  })

  let isEmpty = $derived(graphData.length <= 1)

  // Limited version of graphData for display
  let limitedData = $derived.by<TripEvent[]>(() => [...graphData].slice(-limit, graphData.length))

  let profitLossOverTime = $derived.by<TripEvent[]>(() => {
    if (!limitedData.length) return []

    // The P/L is already calculated in graphData.value from accumulating valueChanges
    return limitedData.map<TripEvent>((point, i) => ({
      ...point,
      time: i,
      value: point.value // Use the already accumulated value
    }))
  })

  let focusedPoints = $derived(
    $focusTrip !== "" && $focusEvent === -1
      ? profitLossOverTime.filter(point => point.tripId === $focusTrip)
      : []
  )

  let leftMostPoint = $derived.by(() => {
    if (!focusedPoints.length) return null
    return focusedPoints.reduce((left, point) =>
      xScale(point.time) < xScale(left.time) ? point : left
    )
  })

  let rightMostPoint = $derived.by(() => {
    if (!focusedPoints.length) return null
    return focusedPoints.reduce((right, point) =>
      xScale(point.time) > xScale(right.time) ? point : right
    )
  })

  let focusedBoundingBox = $derived({
    x: Math.min(...focusedPoints.map(point => xScale(point.time))),
    width:
      Math.max(...focusedPoints.map(point => xScale(point.time))) -
      Math.min(...focusedPoints.map(point => xScale(point.time))),
    y: Math.min(...focusedPoints.map(point => yScale(point.value))),
    height:
      Math.max(...focusedPoints.map(point => yScale(point.value))) -
      Math.min(...focusedPoints.map(point => yScale(point.value))),
    left: leftMostPoint ? xScale(leftMostPoint.time) : 0,
    leftY: leftMostPoint ? yScale(leftMostPoint.value) : 0,
    right: rightMostPoint ? xScale(rightMostPoint.time) : 0,
    rightY: rightMostPoint ? yScale(rightMostPoint.value) : 0
  })

  let topPath = $derived(
    `M ${focusedBoundingBox.left} ${focusedBoundingBox.leftY} L ${focusedBoundingBox.x} ${focusedBoundingBox.leftY} L ${focusedBoundingBox.x} ${focusedBoundingBox.y} L ${
      focusedBoundingBox.x + focusedBoundingBox.width
    } ${focusedBoundingBox.y} L ${
      focusedBoundingBox.x + focusedBoundingBox.width
    } ${focusedBoundingBox.rightY} L ${focusedBoundingBox.right} ${focusedBoundingBox.rightY}`
  )

  let boundingBoxKey = $derived($focusTrip + "-" + focusedPoints.length + "-" + topPath)

  // Toggle the data source used
  const toggleSource = () => {
    if (limit === 50 && graphData.length > 50) {
      limit = graphData.length
    } else {
      limit = 50
    }
  }

  // Auto-expand graph window when keyboard navigating to events outside current view
  $effect(() => {
    if ($focusEvent !== -1 && graphData.length > 0) {
      const focusedEvent = graphData.find(point => point.index === $focusEvent)

      if (focusedEvent) {
        const focusedEventPosition = graphData.indexOf(focusedEvent)
        const windowStart = graphData.length - limit

        // If focused event is before the current window, expand to include it
        if (focusedEventPosition < windowStart) {
          limit = graphData.length - focusedEventPosition
        }
      }
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
      <span>{UI_STRINGS.noData.toUpperCase()}</span>
    </div>
  {:else}
    <div class="graph" bind:clientWidth={width}>
      <div class="legend y">
        <button class="active">{UI_STRINGS.profit}</button>
      </div>
      <div class="legend x">
        {#if onToggleToLog}
          <button onclick={onToggleToLog} class="time-option active tablet-toggle"
            >{UI_STRINGS.log.toUpperCase()}
          </button>
        {:else}
          <button onclick={toggleSource} class="time-option" class:active={timeWindow === "events"}
            >{#if limitedData.length === graphData.length}{UI_STRINGS.all}&nbsp;
            {/if}{#if limitedData.length < graphData.length}{limitedData.length}/{graphData.length}{:else}{limitedData.length}{/if}
            {UI_STRINGS.events.toLowerCase()}
          </button>
        {/if}
      </div>
      {#key $focusEvent}
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
                d={line<TripEvent>()
                  .x(d => xScale(d.time))
                  .y(d => yScale(d.value))(profitLossOverTime)}
                stroke="var(--color-grey-light)"
                stroke-width={2}
                fill="none"
              />

              <!-- Render all non-focused points first -->
              {#each profitLossOverTime.filter(p => $focusEvent !== p.index) as point, i (point.time)}
                {@const focus = point.tripId === $focusTrip && $focusEvent === -1}
                {@const lastPoint = profitLossOverTime?.[profitLossOverTime.indexOf(point) - 1]}

                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <g
                  onpointerenter={() => {
                    $focusTrip = point.tripId
                    $focusEvent = point.index
                  }}
                  onclick={() => handleEventClick(point)}
                  style="cursor: pointer"
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
                        paint-order="stroke"
                        stroke={focus ? "white" : ""}
                        stroke-width="2"
                        fill={point.value < lastPoint.value
                          ? "var(--color-down)"
                          : "var(--color-up)"}
                      >
                      </rect>
                    {/if}
                  {/if}
                  {#if point.eventType === "trip_death"}
                    <circle
                      paint-order="stroke"
                      fill={focus ? "white" : "var(--color-grey-light)"}
                      stroke={focus ? "white" : ""}
                      stroke-width="2"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point.eventType === "trip_liquidated"}
                    <circle
                      paint-order="stroke"
                      fill={focus ? "white" : "var(--color-grey-light)"}
                      stroke={focus ? "white" : ""}
                      stroke-width="2"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else if point.eventType === "trip_created"}
                    <circle
                      paint-order="stroke"
                      fill={focus ? "white" : "var(--color-grey-light)"}
                      stroke={focus ? "white" : ""}
                      stroke-width="2"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {:else}
                    <circle
                      paint-order="stroke"
                      fill={focus ? "white" : "var(--color-grey-light)"}
                      stroke={focus ? "white" : ""}
                      stroke-width="2"
                      r="5"
                      cx={xScale(point.time)}
                      cy={yScale(point.value)}
                    ></circle>
                  {/if}
                </g>
              {/each}

              <!-- Render focused point on top -->
              {#if $focusEvent !== -1}
                {@const focusedPoint = profitLossOverTime.find(p => p.index === $focusEvent)}
                {#if focusedPoint}
                  {@const focusedIndex = profitLossOverTime.indexOf(focusedPoint)}
                  {@const lastPoint = profitLossOverTime?.[focusedIndex - 1]}

                  <!-- Draw line through focused point -->
                  <line
                    x1={xScale(focusedPoint.time)}
                    y1={0}
                    x2={xScale(focusedPoint.time)}
                    y2={height}
                    stroke="var(--color-grey-mid)"
                    stroke-width="2"
                    stroke-dasharray="4,4"
                  />

                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <g
                    onpointerenter={() => {
                      $focusTrip = focusedPoint.tripId
                      $focusEvent = focusedPoint.index
                    }}
                    onclick={() => handleEventClick(focusedPoint)}
                    style="cursor: pointer"
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
                          paint-order="stroke"
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
                        paint-order="stroke"
                        fill="white"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else if focusedPoint.eventType === "trip_liquidated"}
                      <circle
                        paint-order="stroke"
                        fill="white"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else if focusedPoint.eventType === "trip_created"}
                      <circle
                        paint-order="stroke"
                        fill="white"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {:else}
                      <circle
                        paint-order="stroke"
                        fill="white"
                        stroke="white"
                        stroke-width="2"
                        r="5"
                        cx={xScale(focusedPoint.time)}
                        cy={yScale(focusedPoint.value)}
                      ></circle>
                    {/if}
                  </g>
                {/if}
              {/if}
            </g>
          {/if}
        </svg>
      {/key}
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

      &.tablet-toggle {
        @media (min-width: 1025px) {
          display: none;
        }
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
