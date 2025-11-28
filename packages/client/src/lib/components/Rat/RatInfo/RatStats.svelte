<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import HealthBar from "./HealthBar.svelte"
  import { RatAvatar } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { gsap } from "gsap"

  let {
    displayRat,
    oldRat,
    newRat,
    onTimeline
  }: {
    displayRat: Rat | null
    oldRat: Rat | null
    newRat: Rat | null
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Calculate old and new health values
  let oldHealth = $derived(oldRat ? Number(oldRat.balance) : 0)
  let newHealth = $derived(newRat ? Number(newRat.balance) : 0)

  // Elements
  let infoContainer = $state<HTMLDivElement | null>(null)
  let imageContainer = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(infoContainer, { opacity: 0, x: -50 })
    gsap.set(imageContainer, { opacity: 0 })
  }

  const main = () => {
    // Animate info container (name, health, trips) from left
    timeline.to(
      infoContainer,
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: "power2.out"
      },
      0
    )

    // Animate image container (avatar) - just fade in
    timeline.to(
      imageContainer,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
      },
      0.1 // Slight delay for stagger effect
    )
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
    if (infoContainer && imageContainer) {
      run()
    }
  })
</script>

<div class="rat-stats">
  {#if displayRat}
    <!-- INFO -->
    <div class="info-container" bind:this={infoContainer}>
      <!-- INDEX -->
      <div class="info-item index-container">
        <span class="index">{UI_STRINGS.rat} #{displayRat.index}</span>
      </div>

      <!-- NAME -->
      <div class="info-item">
        <span class="name">{displayRat.name}</span>
      </div>

      <!-- HEALTHBAR -->
      <div class="info-item">
        <HealthBar {oldHealth} {newHealth} />
      </div>

      <!-- TRIP COUNT -->
      {#if displayRat.tripCount ?? 0 > 0}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="info-item trip-count"
          role="button"
          tabindex="0"
          onclick={() => ratState.state.transitionTo(RAT_BOX_STATE.PAST_TRIP_LIST)}
        >
          <span>
            {UI_STRINGS.trips}: {displayRat.tripCount ?? 0}
          </span>
        </div>
      {/if}
    </div>

    <!-- IMAGE -->
    <div class="image-container" bind:this={imageContainer}>
      <div class="avatar-wrapper">
        <RatAvatar />
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-stats {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: visible;
    display: flex;
    background-image: url("/images/texture-5.png");
    background-size: 100px;
    justify-content: space-between;

    .info-container {
      width: calc(100% - 260px);
      overflow: visible;

      @media (max-width: 800px) {
        width: auto;
        flex: 1;
      }

      .info-item {
        width: 100%;
        height: 40px;
        border-bottom: var(--default-border-style);
        display: flex;
        align-items: center;
        justify-content: space-between;

        &.index-container {
          @media (max-width: 800px) {
            display: none;
          }
          .index {
            padding-inline: 10px;
            color: var(--foreground);
            font-size: var(--font-size-small);
          }
        }

        .name {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
          color: var(--foreground);
        }

        &.trip-count {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
          cursor: pointer;

          @media (max-width: 800px) {
            display: none;
          }
        }
      }
    }
    .image-container {
      width: 260px;
      height: 100%;
      border-left: var(--default-border-style);
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 800px) {
        width: 180px;
        flex-shrink: 0;
      }

      .avatar-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
</style>
