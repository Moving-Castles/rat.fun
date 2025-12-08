<script lang="ts">
  import { fade } from "svelte/transition"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    listingIndex,
    folder,
    count,
    showCounts = true,
    onclick,
    disabled: disabledProp = false
  }: {
    listingIndex: number
    folder?: TripFolder
    count?: number
    showCounts?: boolean
    onclick: () => void
    disabled?: boolean
  } = $props()

  // showCount == false indicates that we are in create trip modal
  let disabled = $derived(disabledProp || (showCounts && count === 0))

  let title = folder?.title ?? ""
  let tooltip = $derived(folder?.title?.includes("EGO"))
  let isRestricted = $derived(folder?.restricted ?? false)

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
  }
</script>

<div class="tile" in:fade|global={{ duration: 100, delay: listingIndex * 30 }}>
  <Tooltip content={tooltip ? UI_STRINGS.egoDeathExplanation : ""}>
    <button class:disabled class:restricted={isRestricted} {onclick} {onmouseup} {onmousedown}>
      <div class="title">
        {title}
        <span class="count">
          {#if showCounts}
            <br />
            {count ?? 0} trip{count === 1 ? "" : "s"}
          {/if}
        </span>
      </div>
    </button>
  </Tooltip>
</div>

<style lang="scss">
  .tile {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;

    button {
      width: 100%;
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);

      border-style: outset;
      border-width: 10px;
      border-color: var(--background-light-transparent);
      color: var(--background);

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      @media (max-width: 768px) {
        font-size: var(--font-size-normal);
      }

      .title {
        position: relative;

        .count {
          font-size: var(--font-size-normal);
        }
      }
      transition: transform 0.1s ease-in-out;

      @media (min-width: 800px) {
        &:hover {
          border-color: var(--background-light-transparent);
          transform: scale(0.97);
        }
      }

      &:active {
        filter: invert(1);
        transform: scale(0.95);
      }

      background: var(--color-grey-lighter);

      &.restricted {
        background: var(--color-restricted-trip-folder);
      }

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
        // filter: grayscale(100%);
      }
    }
  }
</style>
