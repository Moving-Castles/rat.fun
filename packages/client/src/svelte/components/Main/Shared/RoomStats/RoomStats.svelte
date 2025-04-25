<script lang="ts">
  import { scaleTime, scaleLinear } from "d3-scale"
  import { extent, max } from "d3-array"
  import { line } from "d3-shape"
  import tippy from "tippy.js"
  import "tippy.js/dist/tippy.css" // optional for styling

  type DataPoint = { time: number; value: number }

  let { data } = $props()

  // Layout setup
  let width = $state(0) // width will be set by the clientWidth
  const height = 170

  const padding = { top: 6, right: 6, bottom: 6, left: 6 }

  // Calculate inner dimensions based on padding
  let innerWidth = $derived(width - padding.left - padding.right)
  let innerHeight = $derived(height - padding.top - padding.bottom)

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
          .domain([0, max(data, (d: DataPoint) => +d.value + 250)])
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

  $effect(() => {
    if (data && width && xScale && yScale && lineGenerator) {
      setTimeout(() => {
        tippy("[data-tippy-content]", {
          allowHTML: true,
        })
      })
    }
  })
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
            <g
              data-tippy-content="<div class='center-tooltip'>{point?.meta
                ?.ratName
                ? `${point?.meta?.ratName ? point?.meta?.ratName : ''}`
                : `$${point.value}`} <br> {point?.meta?.roomValueChange}</div>"
            >
              {#if !point?.meta?.roomValueChange || point?.meta?.roomValueChange === 0}
                <circle
                  fill="var(--color-value)"
                  r="6"
                  cx={xScale(point.time)}
                  cy={yScale(point.value)}
                ></circle>
              {:else if point?.meta?.roomValueChange > 0}
                <polygon
                  transform="translate({xScale(point.time)}, {yScale(
                    point.value
                  )}) scale(1, 1.5)"
                  fill="var(--color-value-up)"
                  points="-5 2.5, 0 -5, 5 2.5"
                />
              {:else}
                <polygon
                  transform="translate({xScale(point.time)}, {yScale(
                    point.value
                  )}) scale(1, 1.5)"
                  fill="var(--color-value-down)"
                  points="-5 -2.5, 0 5, 5 -2.5"
                />
              {/if}
            </g>
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
