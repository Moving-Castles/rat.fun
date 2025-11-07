<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { frozenRat, resetProcessingState } from "$lib/components/GameRun/state.svelte"
  import { goto } from "$app/navigation"
  import { gsap } from "gsap"
  import { BigButton, RatAvatar } from "$lib/components/Shared"
  import { shouldUnlockAdmin, showAdminUnlockModal } from "$lib/modules/state/stores"
  import { isPhone } from "$lib/modules/ui/state.svelte"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  // Figure out if rat died or survived
  const ratDead = $derived(result?.ratDead)
  const statusText = $derived(ratDead ? "DIED" : "SURVIVED")
  const buttonText = $derived(ratDead ? "MOVE ON" : "COME DOWN")

  // Elements
  let eventElement = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(eventElement, { opacity: 0 })
  }

  const main = () => {
    timeline.to(eventElement, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline, 0)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (eventElement) {
      run()
    }
  })

  const comeDown = () => {
    // Check if admin should be unlocked after rat death in trip
    if (ratDead && $shouldUnlockAdmin) {
      showAdminUnlockModal.set(true)
    }

    resetProcessingState()
    // Return to game
    goto("/", { invalidateAll: true })
  }
</script>

<div class="event" bind:this={eventElement}>
  {#if !$isPhone}
    <div class="image">
      <RatAvatar />
    </div>
  {/if}
  <div class="event-text" class:dead={ratDead}>
    {frozenRat?.name}
    {statusText}
  </div>
  <div class="button-container">
    <BigButton text={buttonText} onclick={comeDown} />
  </div>
</div>

<style lang="scss">
  .event {
    margin: 0;
    padding: 0;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 90%;

    .image {
      width: 260px;
      height: 260px;
      margin-bottom: 10px;
      overflow: visible;
      position: absolute;
      top: -180px;
    }

    .event-text {
      font-size: var(--font-size-extra-large);
      font-family: var(--special-font-stack);
      margin-bottom: 20px;

      &.dead {
        color: black;
        background: red;
      }
    }

    .button-container {
      width: 100%;
      height: 120px;
    }
  }
</style>
