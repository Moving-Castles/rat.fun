<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import gsap from "gsap"
  import { terminalTyper, type TerminalOutputUnit, type PlaySoundFn } from "../terminal-typer"

  let {
    entranceOn = false,
    bigDanceOn = false,
    smallDanceOn = false,
    headBobOn = false,
    text = [],
    smallText = false,
    hugeText = false,
    isGameMascot = false,
    closeTextOnClick = false,
    finishTextOnClick = false,
    autoHideAfter = 0,
    playSound
  }: {
    entranceOn?: boolean
    bigDanceOn?: boolean
    smallDanceOn?: boolean
    headBobOn?: boolean
    text?: TerminalOutputUnit[]
    smallText?: boolean
    hugeText?: boolean
    isGameMascot?: boolean
    closeTextOnClick?: boolean
    finishTextOnClick?: boolean
    autoHideAfter?: number
    playSound?: PlaySoundFn
  } = $props()

  let isAnimating = $state(false)
  let showBubble = $state(true)
  let typerController: ReturnType<typeof terminalTyper> | null = null

  const enterTimeline = gsap.timeline({ paused: true })
  const bigDanceTimeline = gsap.timeline({ repeat: -1, yoyo: true })
  const smallDanceTimeline = gsap.timeline({ repeat: -1, yoyo: true })
  const headBobTimeline = gsap.timeline({ repeat: -1, yoyo: true })

  // Elements
  let mascotElement: HTMLDivElement | null = $state(null)
  let layer4Element: HTMLDivElement | null = $state(null)
  let layer3Element: HTMLDivElement | null = $state(null)
  let layer2Element: HTMLDivElement | null = $state(null)
  let layer1Element: HTMLDivElement | null = $state(null)
  let bubbleElement: HTMLDivElement | null = $state(null)

  onMount(async () => {
    isAnimating = true

    // Start terminal typer if text is provided
    if (text.length > 0 && bubbleElement) {
      // Pre-render content to measure final height
      for (const unit of text) {
        const line = document.createElement("div")
        line.className = "terminal-line"
        line.textContent = unit.content
        bubbleElement.appendChild(line)
      }

      // Set fixed height based on measured content
      const finalHeight = bubbleElement.offsetHeight
      bubbleElement.style.height = finalHeight + "px"

      // Clear and start typing
      bubbleElement.innerHTML = ""
      typerController = terminalTyper(bubbleElement, text, playSound)
    }

    // Starting states
    if (entranceOn) {
      enterTimeline.set(mascotElement, {
        opacity: 0,
        scale: 0
      })

      // Play sound
      enterTimeline.call(
        () => {
          playSound?.({ category: "ratfunUI", id: "giggle2" })
        },
        [],
        "0.5"
      )

      // Animate in whole mascot
      enterTimeline.to(
        mascotElement,
        {
          duration: 0.7,
          opacity: 1,
          scale: 1,
          ease: "elastic.out(1.5)"
        },
        "0.5"
      )

      // Animation complete
      enterTimeline.call(() => {
        isAnimating = false
      })

      enterTimeline.play()
    }

    if (bigDanceOn) {
      setupBigDanceTimeline()
    } else if (smallDanceOn) {
      setupSmallDanceTimeline()
    } else if (headBobOn) {
      setupHeadBobTimeline()
    }

    // Auto-hide bubble after specified time
    if (autoHideAfter > 0) {
      setTimeout(() => {
        typerController?.stop()
        showBubble = false
      }, autoHideAfter)
    }
  })

  const setupBigDanceTimeline = () => {
    // Body
    bigDanceTimeline.to(
      layer1Element,
      {
        rotation: -2,
        duration: 0.4,
        ease: "sine.inOut"
      },
      "<"
    )

    // Arms
    bigDanceTimeline.to(
      layer2Element,
      {
        rotation: 4,
        duration: 0.4,
        ease: "expo.inOut"
      },
      "<"
    )

    // Head
    bigDanceTimeline.to(
      layer3Element,
      {
        scale: 1.5,
        rotation: -4,
        duration: 0.4,
        ease: "expo.inOut"
      },
      "<"
    )

    // Hat
    bigDanceTimeline.to(
      layer4Element,
      {
        scale: 1.5,
        y: -30,
        rotation: 4,
        duration: 0.4,
        ease: "expo.inOut"
      },
      "<"
    )

    // Start the dance timeline
    bigDanceTimeline.play()
  }

  const setupSmallDanceTimeline = () => {
    // Arms + head
    smallDanceTimeline.to([layer2Element, layer3Element], {
      rotation: -2,
      duration: 0.4,
      ease: "sine.inOut"
    })

    // Arms + head
    smallDanceTimeline.to([layer2Element, layer3Element], {
      rotation: 2,
      duration: 0.4,
      ease: "sine.inOut"
    })

    // Start the dance timeline
    smallDanceTimeline.play()
  }

  const setupHeadBobTimeline = () => {
    // Head only
    headBobTimeline.to(layer3Element, {
      rotation: -2,
      duration: 0.5,
      ease: "power2.inOut"
    })

    headBobTimeline.to(layer3Element, {
      rotation: 2,
      duration: 0.5,
      ease: "power2.inOut"
    })

    headBobTimeline.play()
  }

  function handleClick() {
    if (closeTextOnClick) {
      typerController?.stop()
      showBubble = false
    } else if (finishTextOnClick && bubbleElement) {
      typerController?.stop()
      // Render all text immediately
      bubbleElement.innerHTML = ""
      for (const unit of text) {
        const line = document.createElement("div")
        line.className = "terminal-line"
        const span = document.createElement("span")
        span.textContent = unit.content
        span.style.color = unit.color
        span.style.backgroundColor = unit.backgroundColor
        line.appendChild(span)
        bubbleElement.appendChild(line)
      }
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="mascot-container"
  class:clickable={closeTextOnClick || finishTextOnClick}
  onclick={handleClick}
>
  {#if text.length > 0 && showBubble}
    <div
      class="bubble"
      class:small-text={smallText}
      class:huge-text={hugeText}
      out:fade={{ duration: 200 }}
      class:isGameMascot
      bind:this={bubbleElement}
    ></div>
  {/if}

  <div class="mascot" bind:this={mascotElement}>
    <!-- LAYER 4-->
    <div class="layer layer-4" bind:this={layer4Element}>
      <img src="/images/mascot/mascot-layer-4.png" draggable={false} alt="RAT.FUN" />
    </div>
    <!-- LAYER 3-->
    <div class="layer layer-3" bind:this={layer3Element}>
      <img src="/images/mascot/mascot-layer-3.png" draggable={false} alt="RAT.FUN" />
    </div>
    <!-- LAYER 2-->
    <div class="layer layer-2" bind:this={layer2Element}>
      <img src="/images/mascot/mascot-layer-2.png" draggable={false} alt="RAT.FUN" />
    </div>
    <!-- LAYER 1 -->
    <div class="layer layer-1" bind:this={layer1Element}>
      <img src="/images/mascot/mascot-layer-1.png" draggable={false} alt="RAT.FUN" />
    </div>
  </div>
</div>

<style lang="scss">
  .mascot-container {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1/1;
    pointer-events: none;

    &.clickable {
      pointer-events: auto;
      cursor: pointer;
    }
  }

  .bubble {
    position: absolute;
    top: -60px;
    right: 50%;
    transform: translateX(50%);
    z-index: 10;
    padding: 10px;
    width: 900px;
    max-width: 90dvw;
    pointer-events: none;
    font-size: var(--font-size-mascot);
    font-family: var(--mascot-font-stack);
    color: var(--foreground);
    text-align: left;
    line-height: 1.4em;

    &.small-text {
      font-size: 24px;
    }

    &.huge-text {
      font-size: calc(var(--font-size-ultra) * 0.5);
      text-align: center;
    }

    &.isGameMascot {
      width: 60dvw;
      top: 00px;
      right: 20px;
      line-height: 1.2em;
    }
  }

  .mascot {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1/1;
    object-fit: contain;
    opacity: 1;
    pointer-events: none;
    user-select: none;

    .layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;

      &.layer-1 {
        z-index: 1;
      }
      &.layer-2 {
        z-index: 2;
      }
      &.layer-3 {
        z-index: 3;
      }
      &.layer-4 {
        z-index: 4;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  @media (max-width: 800px) {
    .bubble {
      top: 80px;
      position: fixed;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: calc(100dvw - 40px);
      max-width: calc(100dvw - 40px);
      padding: 12px 16px;
      border-width: 2px;

      &.small-text {
        font-size: 18px;
      }

      &.huge-text {
        font-size: calc(var(--font-size-ultra) * 0.25);
        text-align: center;
      }

      &.isGameMascot {
        width: 90dvw;
        top: 100px;
        right: auto;
      }
    }
  }
</style>
