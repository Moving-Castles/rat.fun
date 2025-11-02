<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import { focusEvent, focusTrip } from "$lib/modules/ui/state.svelte"
  import { goto } from "$app/navigation"
  import { scaleTime, scaleLinear } from "d3-scale"
  import { page } from "$app/state"
  import { max, min } from "d3-array"
  import { line } from "d3-shape"

  let {
    graphData,
    height = 400
  }: {
    graphData: TripEvent[]
    height: number
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
  let limitedData = $derived([...graphData].slice(-limit, graphData.length))

  let profitLossOverTime = $derived.by(() => {
    if (!limitedData.length) return []

    // The P/L is already calculated in graphData.value from accumulating valueChanges
    return limitedData.map((point, i) => ({
      time: i,
      index: point.index,
      value: point.value, // Use the already accumulated value
      valueChange: point.valueChange,
      tripId: point.tripId,
      tripCreationCost: point.tripCreationCost,
      eventType: point.eventType,
      meta: point.meta // undefined on TripEventBaseline
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

  let bottomPath = $derived(
    `M ${focusedBoundingBox.left} ${focusedBoundingBox.leftY} L ${focusedBoundingBox.x} ${focusedBoundingBox.leftY} L ${focusedBoundingBox.x} ${
      focusedBoundingBox.y + focusedBoundingBox.height
    } L ${focusedBoundingBox.x + focusedBoundingBox.width} ${
      focusedBoundingBox.y + focusedBoundingBox.height
    } L ${
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
        <button class="active">Profit</button>
      </div>
      <div class="legend x">
        <button onclick={toggleSource} class="time-option" class:active={timeWindow === "events"}
          >{#if limitedData.length === graphData.length}All&nbsp;
          {/if}events ({#if limitedData.length < graphData.length}{limitedData.length}/{graphData.length}{:else}{limitedData.length}{/if})
          {focusedBoundingBox.x}
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
            <!-- line through selected points -->
            <!-- Doesn't make too much sense, because it is actually not showing a real development -->
            {#if focusedPoints.length > 0}
              <!-- <path
                d={line()
                  .x(d => xScale(d.time))
                  .y(d => yScale(d.value))(focusedPoints)}
                stroke="white"
                stroke-width={2}
                fill="none"
              /> -->
            {/if}

            <!-- Box around the points if multiple datapoints are selected -->
            {#key boundingBoxKey}
              <!-- <path
                d={topPath}
                fill="none"
                stroke="var(--color-grey-mid)"
                stroke-width="3"
                in:draw|global={{ duration: 200 }}
                out:drawReverse={{ duration: 200 }}
              />
              <path
                d={bottomPath}
                fill="none"
                stroke="var(--color-grey-mid)"
                stroke-width="3"
                in:draw|global={{ duration: 200 }}
                out:drawReverse={{ duration: 200 }}
              /> -->
            {/key}

            {#each profitLossOverTime as point, i (point.time)}
              {@const focus =
                $focusEvent === point.index || (point.tripId === $focusTrip && $focusEvent === -1)}
              {@const lastPoint = profitLossOverTime?.[i - 1]}

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

              <!-- <Tooltip
                content={generateTooltipContent(point)}
                svg={true}
                props={{ allowHTML: true }}
              > -->
              <g
                onpointerenter={() => {
                  $focusTrip = point.tripId
                  $focusEvent = point.index
                }}
                onpointerdown={() => {
                  // Play sound
                }}
                onpointerup={() => {
                  goto(`/cashboard/${point.tripId}?focusId=${point?.meta?._id || ""}`)
                }}
                onpointerleave={() => {
                  if (!page.route?.id?.includes("/cashboard/[tripId]")) {
                    $focusTrip = ""
                    $focusEvent = -1
                  }
                }}
              >
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
                      fill={point.value < lastPoint.value ? "var(--color-down)" : "var(--color-up)"}
                    >
                    </rect>
                  {/if}
                {/if}
              </g>
              <!-- </Tooltip> -->
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
