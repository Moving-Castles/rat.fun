<script lang="ts">
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { gsap } from "gsap"

  let {
    onTimeline
  }: {
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let healthElement = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(healthElement, { opacity: 0 })
  }

  const main = () => {
    timeline.to(healthElement, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (healthElement) {
      run()
    }
  })
</script>

<!-- HEALTH -->
<div class="health" bind:this={healthElement}>
  OLD HEALTH:{$frozenRat?.initialBalance}
  NEW HEALTH:{Number($frozenRat?.balance)}
</div>

<style lang="scss">
  .health {
    background: blue;
    padding: 20px;
  }
</style>
