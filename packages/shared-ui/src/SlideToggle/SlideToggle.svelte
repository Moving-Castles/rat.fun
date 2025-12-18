<script lang="ts">
  export type SlideToggleOption = {
    value: string
    label: string
  }

  let {
    options,
    value,
    onchange,
    disabled = false,
    height,
    secondary = false,
    onSelect
  }: {
    options: SlideToggleOption[]
    value: string
    onchange: (value: string) => void
    disabled?: boolean
    height?: number
    /** Secondary style with smaller font and typewriter font */
    secondary?: boolean
    /** Optional callback when an option is selected (for sound effects, etc.) */
    onSelect?: () => void
  } = $props()

  let railElement: HTMLDivElement | null = $state(null)
  let isDragging = $state(false)
  let isSettling = $state(false)
  let dragOffset = $state(0)
  let startX = $state(0)
  let startTime = $state(0)

  // Calculate which option index is currently selected
  let activeIndex = $derived(options.findIndex(o => o.value === value))

  // Calculate option width as percentage
  let optionWidthPercent = $derived(100 / options.length)

  // Calculate marker position in pixels
  let markerPosition = $derived.by(() => {
    if (!railElement) return null

    const railWidth = railElement.offsetWidth
    const optionWidth = railWidth / options.length
    const basePosition = activeIndex * optionWidth

    if (isDragging) {
      // Clamp drag offset within bounds
      const minOffset = -activeIndex * optionWidth
      const maxOffset = (options.length - 1 - activeIndex) * optionWidth
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, dragOffset))
      return basePosition + clampedOffset
    }

    if (isSettling) {
      // During settling, animate to the new position
      return basePosition
    }

    return null
  })

  function getOptionAtPosition(x: number): number {
    if (!railElement) return activeIndex
    const rect = railElement.getBoundingClientRect()
    const relativeX = x - rect.left
    const optionWidth = rect.width / options.length
    const index = Math.floor(relativeX / optionWidth)
    return Math.max(0, Math.min(options.length - 1, index))
  }

  function selectOption(newValue: string) {
    if (disabled || newValue === value) return
    onSelect?.()
    onchange(newValue)
  }

  function handleTouchStart(e: TouchEvent) {
    if (disabled) return
    isDragging = true
    startX = e.touches[0].clientX
    startTime = Date.now()
    dragOffset = 0
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging || disabled) return
    e.preventDefault()
    const currentX = e.touches[0].clientX
    dragOffset = currentX - startX
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!isDragging || disabled) return

    const endX = e.changedTouches[0].clientX
    const dragDistance = Math.abs(endX - startX)
    const dragDuration = Date.now() - startTime

    // If it was a quick tap (small distance, short time), treat as tap on end position
    if (dragDistance < 10 && dragDuration < 200) {
      const tappedIndex = getOptionAtPosition(endX)
      if (tappedIndex !== activeIndex) {
        selectOption(options[tappedIndex].value)
      }
    } else {
      // It was a drag - 20% threshold to move to adjacent options
      if (railElement) {
        const rect = railElement.getBoundingClientRect()
        const optionWidth = rect.width / options.length
        const dragInOptions = dragOffset / optionWidth

        // 20% threshold: need to drag 20% of option width to trigger move
        let targetIndex: number
        if (dragInOptions >= 0.2) {
          // Dragging right: move forward by how many 20% thresholds we've crossed
          targetIndex = activeIndex + Math.floor(dragInOptions + 0.8)
        } else if (dragInOptions <= -0.2) {
          // Dragging left: move backward
          targetIndex = activeIndex + Math.ceil(dragInOptions - 0.8)
        } else {
          targetIndex = activeIndex
        }
        targetIndex = Math.max(0, Math.min(options.length - 1, targetIndex))

        if (targetIndex !== activeIndex) {
          selectOption(options[targetIndex].value)
        }
      }
    }

    // Enable settling state for snap animation
    isDragging = false
    isSettling = true
    setTimeout(() => {
      isSettling = false
      dragOffset = 0
    }, 250)
  }

  function handleMouseDown(e: MouseEvent) {
    if (disabled) return
    isDragging = true
    startX = e.clientX
    startTime = Date.now()
    dragOffset = 0

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || disabled) return
    dragOffset = e.clientX - startX
  }

  function handleMouseUp(e: MouseEvent) {
    if (!isDragging || disabled) return

    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)

    const dragDistance = Math.abs(e.clientX - startX)
    const dragDuration = Date.now() - startTime

    if (dragDistance < 10 && dragDuration < 200) {
      const tappedIndex = getOptionAtPosition(e.clientX)
      if (tappedIndex !== activeIndex) {
        selectOption(options[tappedIndex].value)
      }
    } else {
      // It was a drag - 20% threshold to move to adjacent options
      if (railElement) {
        const rect = railElement.getBoundingClientRect()
        const optionWidth = rect.width / options.length
        const dragInOptions = dragOffset / optionWidth

        // 20% threshold: need to drag 20% of option width to trigger move
        let targetIndex: number
        if (dragInOptions >= 0.2) {
          // Dragging right: move forward by how many 20% thresholds we've crossed
          targetIndex = activeIndex + Math.floor(dragInOptions + 0.8)
        } else if (dragInOptions <= -0.2) {
          // Dragging left: move backward
          targetIndex = activeIndex + Math.ceil(dragInOptions - 0.8)
        } else {
          targetIndex = activeIndex
        }
        targetIndex = Math.max(0, Math.min(options.length - 1, targetIndex))

        if (targetIndex !== activeIndex) {
          selectOption(options[targetIndex].value)
        }
      }
    }

    // Enable settling state for snap animation
    isDragging = false
    isSettling = true
    setTimeout(() => {
      isSettling = false
      dragOffset = 0
    }, 250)
  }

  function handleOptionClick(option: SlideToggleOption) {
    selectOption(option.value)
  }
</script>

<div
  class="slide-toggle-rail"
  class:disabled
  class:dragging={isDragging}
  class:settling={isSettling}
  class:secondary
  style={height ? `height: ${height}px` : undefined}
  bind:this={railElement}
>
  <!-- Background option labels (tappable) -->
  {#each options as option, i}
    <button
      type="button"
      class="option"
      class:active={value === option.value}
      style="width: {optionWidthPercent}%"
      onclick={() => handleOptionClick(option)}
      {disabled}
    >
      <span class="option-label">{option.label}</span>
    </button>
  {/each}

  <!-- Sliding marker (draggable) -->
  <div
    class="marker"
    style="
      width: calc({optionWidthPercent}% - 8px);
      transform: translateX({markerPosition !== null
      ? markerPosition + 'px'
      : 'calc(' + activeIndex * 100 + '% + ' + activeIndex * 8 + 'px)'});
    "
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    onmousedown={handleMouseDown}
    role="slider"
    aria-valuenow={activeIndex}
    aria-valuemin={0}
    aria-valuemax={options.length - 1}
    tabindex={disabled ? -1 : 0}
  >
    <span class="marker-label">{isDragging ? "?" : options[activeIndex]?.label}</span>
  </div>
</div>

<style lang="scss">
  .slide-toggle-rail {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    background: var(--background-semi-transparent);
    border-bottom: var(--default-border-style);
    flex-shrink: 0;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &.secondary {
      .option .option-label,
      .marker .marker-label {
        font-size: var(--font-size-normal);
        font-family: var(--typewriter-font-stack);
      }
    }
  }

  .option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    z-index: 1;

    .option-label {
      font-size: var(--font-size-large);
      font-family: var(--special-font-stack);
      color: var(--foreground);
      opacity: 0.4;
      transition: opacity 0.15s ease;
    }

    &.active .option-label {
      opacity: 0;
    }

    .dragging &.active .option-label {
      opacity: 0.4;
    }

    &:disabled {
      cursor: default;
    }
  }

  .marker {
    position: absolute;
    top: 4px;
    left: 4px;
    height: calc(100% - 8px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-grey-light);
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: var(--background-light-transparent);
    border-radius: 4px;
    cursor: grab;
    z-index: 2;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    touch-action: none;

    .dragging & {
      transition: none;
      cursor: grabbing;
    }

    .marker-label {
      font-size: var(--font-size-large);
      font-family: var(--special-font-stack);
      color: var(--background);
      pointer-events: none;
    }

    &:active {
      background: var(--color-grey-mid);
      border-style: inset;
    }
  }
</style>
