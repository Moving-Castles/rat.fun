<script lang="ts">
  import { scaleTime, scaleLinear } from "d3-scale"
  import { extent, max } from "d3-array"
  import { line, curveBasis } from "d3-shape"
  import { draw } from "svelte/transition"

  type DataPoint = { time: number; value: number }

  const roomData: DataPoint[] = [
    {
      time: 0,
      value: 250,
    },
    {
      time: 1,
      value: 200,
    },
    {
      time: 2,
      value: 120,
    },
    {
      time: 3,
      value: 280,
    },
    {
      time: 4,
      value: 220,
    },
    {
      time: 5,
      value: 10,
    },
  ]

  let { content } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  const height = 170

  const padding = { top: 3, right: 3, bottom: 3, left: 3 }

  // Calculate inner dimensions based on padding
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

  // State variables
  let data = $state(roomData)

  // Computed values
  let xScale = $derived(
    data && innerWidth
      ? scaleTime()
          .domain(extent(data, (d: DataPoint) => d.time))
          .range([0, innerWidth])
      : null
  )

  let yScale = $derived(
    data && width
      ? scaleLinear()
          .domain([0, max(data, (d: DataPoint) => +d.value)])
          .range([innerHeight, 0])
      : null
  )

  // Line function from D3 to create the d attribute for a path element
  // which will be our line.
  let lineGenerator = $derived(
    xScale && yScale
      ? line()
          .x((d: DataPoint) => xScale(d.time))
          .y((d: DataPoint) => yScale(+d.value))
      : // .curve(curveBasis)
        null
  )

  let baseLine = $derived(
    xScale && yScale
      ? line()
          .x((d: DataPoint) => xScale(d.time))
          .y((_: DataPoint) => yScale(data?.[0].value))
      : // .curve(curveBasis)
        null
  )

  $inspect(content)
</script>

<div class="room-stats">
  <div class="y-axis">
    <small class="label">Value</small>
  </div>
  <div class="x-axis">
    <small class="label">Time</small>
  </div>

  <div class="graph" bind:clientWidth={width}>
    {#if data && width && xScale && yScale && lineGenerator}
      <svg {width} {height}>
        <g transform="translate({padding.left}, {padding.top})">
          <!-- in:draw={{ duration: 2000 }} -->
          <path
            d={lineGenerator(data)}
            stroke="var(--color-value)"
            stroke-width={1}
            fill="none"
          />
          <path
            d={baseLine(data)}
            stroke="#eee"
            stroke-width={1}
            stroke-dasharray="8"
            fill="none"
          />

          {#each data as point (point.time)}
            <circle
              fill="var(--color-value)"
              r="3"
              cx={xScale(point.time)}
              cy={yScale(point.value)}
            ></circle>
          {/each}
        </g>
      </svg>
    {/if}
  </div>
</div>

<style lang="scss">
  .room-stats {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .y-axis {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    border-right: 1px solid var(--color-grey-mid);
    width: 30px;
    height: 100%;
    position: absolute;

    .label {
      display: inline-block;
      padding: 10px 8px 0 6px;
    }
  }
  .x-axis {
    border-bottom: 1px solid var(--color-grey-mid);
    width: 100%;
    height: 30px;
    position: absolute;
    bottom: 0;
    z-index: 1;

    .label {
      text-align: right;
      display: inline-block;
      padding: 8px 0 6px calc(100% - 50px);
    }
  }

  .graph {
    width: 100%;
    height: 100%;
    right: 0;
    top: 0;
    position: absolute;
  }
</style>
