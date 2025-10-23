<script lang="ts">
  import type { Snippet } from "svelte"

  type Direction = "left" | "right" | "up"

  interface Props {
    direction?: Direction
    pauseOnHover?: boolean
    reverse?: boolean
    fade?: boolean
    innerClassName?: string
    numberOfCopies?: number
    speed?: number
    class?: string
    children?: Snippet
  }

  let {
    direction = "left",
    pauseOnHover = false,
    reverse = false,
    fade = false,
    innerClassName = "",
    numberOfCopies = 2,
    speed = 30,
    class: className = "",
    children
  }: Props = $props()
</script>

<div
  class="marquee {className}"
  class:flex-row={direction === "left" || direction === "right"}
  class:flex-col={direction === "up"}
  style:mask-image={fade
    ? `linear-gradient(${
        direction === "up" ? "to bottom" : "to right"
      }, transparent 0%, rgba(0, 0, 0, 1.0) 10%, rgba(0, 0, 0, 1.0) 90%, transparent 100%)`
    : "none"}
  style:-webkit-mask-image={fade
    ? `linear-gradient(${
        direction === "up" ? "to bottom" : "to right"
      }, transparent 0%, rgba(0, 0, 0, 1.0) 10%, rgba(0, 0, 0, 1.0) 90%, transparent 100%)`
    : "none"}
>
  {#each Array(numberOfCopies).fill(0) as _, i (i)}
    <div
      class="marquee-inner {innerClassName}"
      class:animate-marquee-left={direction === "left"}
      class:animate-marquee-right={direction === "right"}
      class:animate-marquee-up={direction === "up"}
      class:flex-row={direction === "left" || direction === "right"}
      class:flex-col={direction === "up"}
      class:pause-on-hover={pauseOnHover}
      class:direction-reverse={reverse}
      style:animation-duration="{speed}s"
    >
      {@render children?.()}
    </div>
  {/each}
</div>

<style lang="scss">
  .marquee {
    display: flex;
    gap: 1rem;
    overflow: hidden;

    &.flex-row {
      flex-direction: row;
    }

    &.flex-col {
      flex-direction: column;
    }
  }

  .marquee-inner {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
    flex-shrink: 0;

    &.flex-row {
      flex-direction: row;
    }

    &.flex-col {
      flex-direction: column;
    }

    &.animate-marquee-left {
      animation: marquee-left linear infinite;
    }

    &.animate-marquee-right {
      animation: marquee-right linear infinite;
    }

    &.animate-marquee-up {
      animation: marquee-up linear infinite;
    }

    &.pause-on-hover {
      .marquee:hover & {
        animation-play-state: paused;
      }
    }

    &.direction-reverse {
      animation-direction: reverse;
    }
  }

  @keyframes marquee-left {
    0% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(calc(-100% - 1rem));
    }
  }

  @keyframes marquee-right {
    0% {
      transform: translateX(calc(-100% - 1rem));
    }
    100% {
      transform: translateX(0%);
    }
  }

  @keyframes marquee-up {
    0% {
      transform: translateY(0%);
    }
    100% {
      transform: translateY(calc(-100% - 1rem));
    }
  }
</style>
