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
    disabled: disabledProp = false,
    restricted = false
  }: {
    listingIndex: number
    folder?: TripFolder
    count?: number
    showCounts?: boolean
    onclick: () => void
    disabled?: boolean
    restricted?: boolean
  } = $props()

  let disabled = $derived(disabledProp || (showCounts && count === 0))

  let title = folder?.title ?? ""
  let tooltip = $derived(folder?.title?.includes("EGO"))

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
  }
</script>

<div class="tile" in:fade|global={{ duration: 100, delay: listingIndex * 30 }}>
  <Tooltip content={tooltip ? UI_STRINGS.egoDeathExplanation : ""}>
    <button class:disabled class:restricted {onclick} {onmouseup} {onmousedown}>
      <div class="title">
        {title}
      </div>
      {#if showCounts}
        <div class="count">
          {count ?? 0} trip{count === 1 ? "" : "s"}
        </div>
      {/if}
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
      position: relative;
      width: 100%;
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-medium);

      border-style: outset;
      border-width: 10px;
      border-color: var(--background-semi-transparent);
      color: var(--background);

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      background: var(--color-grey-light);

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("/images/spiral4.png");
        background-repeat: no-repeat;
        background-size: 200% 200%;
        background-position: center;
        opacity: 0.2;
        z-index: 0;
      }

      @media (max-width: 768px) {
        font-size: var(--font-size-normal);
      }

      .title {
        position: relative;
        z-index: 1;
        background: var(--color-grey-light);
        padding: 4px;
        border-radius: 4px;
      }

      .count {
        font-size: var(--font-size-normal);
        color: var(--color-grey-light);
        background: var(--color-grey-dark);
        padding: 4px;
        border-radius: 4px;
        z-index: 1;
        margin-top: 5px;
      }

      transition: transform 0.1s ease-in-out;

      @media (min-width: 800px) {
        &:hover {
          border-color: var(--background-semi-transparent);
          transform: scale(0.97);
        }
      }

      &:active {
        filter: invert(1);
        transform: scale(0.95);
      }

      &.restricted {
        background: var(--color-restricted-trip-folder);
      }

      &.disabled {
        opacity: 0.7;
        pointer-events: none;
      }
    }
  }
</style>
