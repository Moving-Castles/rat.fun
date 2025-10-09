<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { gsap } from "gsap"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  let itemsElement = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(itemsElement, { opacity: 0 })
  }

  const main = () => {
    timeline.to(itemsElement, {
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
    if (itemsElement) {
      run()
    }
  })
</script>

<!-- ITEMS -->
<div class="items" bind:this={itemsElement}>
  {#each result.itemChanges ?? [] as itemChange}
    {itemChange.type}:{itemChange.name}:{itemChange.type === "add" ? "+" : "-"}{itemChange.value}
  {/each}
</div>

<style lang="scss">
  .items {
    background: red;
    padding: 20px;
  }
</style>
