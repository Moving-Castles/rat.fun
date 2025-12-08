<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import {
    frozenRat,
    resetProcessingState,
    resetFrozenState
  } from "$lib/components/GameRun/state.svelte"
  import { goto } from "$app/navigation"
  import { gsap } from "gsap"
  import { BigButton, RatAvatar } from "$lib/components/Shared"
  import { isPhone, selectedFolderId, phoneActiveGameView } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import {
    setPendingMascotMessage,
    isFirstDeathShown,
    setFirstDeathShown,
    setLastDeadRatName
  } from "$lib/modules/ui/mascot-messages"
  import { player } from "$lib/modules/state/stores"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  // Figure out if rat died or survived
  const ratDead = $derived(result?.ratDead)
  const statusText = $derived(ratDead ? UI_STRINGS.died : UI_STRINGS.survived)
  const buttonText = $derived(ratDead ? UI_STRINGS.moveOn : UI_STRINGS.comeDown)

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
    resetProcessingState()

    if (ratDead) {
      // Store the dead rat's name for mascot messages
      const deadRatName = frozenRat?.name
      if (deadRatName) {
        setLastDeadRatName(deadRatName)
      }

      // Get dead rat count from player's pastRats
      const deadRatCount = $player?.pastRats?.length

      // Set death message - first death or subsequent
      if (!isFirstDeathShown()) {
        setPendingMascotMessage({ type: "first_death", deadRatName })
        setFirstDeathShown()
      } else {
        setPendingMascotMessage({ type: "death_trip", deadRatCount, deadRatName })
      }

      // Rat died - reset folder selection and frozen state
      selectedFolderId.set("") // Return to folder listing
      resetFrozenState() // Clear frozenRat so next rat doesn't animate from old rat
      // On phone, go back to ratbox
      phoneActiveGameView.set("ratbox")
    } else {
      // Rat survived - check for big win
      const payout =
        result.balanceTransfers?.reduce((acc, transfer) => acc + transfer.amount, 0) ?? 0

      if (payout >= 200) {
        setPendingMascotMessage({ type: "bigwin", payout })
      }
    }

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

      @media (max-width: 768px) {
        display: none;
      }
    }

    .event-text {
      font-size: var(--font-size-extra-large);
      font-family: var(--special-font-stack);
      margin-bottom: 20px;

      &.dead {
        color: var(--background);
        background: var(--color-death);
      }

      @media (max-width: 768px) {
        display: none;
      }
    }

    .button-container {
      width: 100%;
      height: 120px;
    }
  }
</style>
