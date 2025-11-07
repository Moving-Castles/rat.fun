<script lang="ts">
  import { fade } from "svelte/transition"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"
  //   import { urlFor, type ImageUrlBuilder } from "$lib/modules/content/sanity"

  let {
    listingIndex,
    folder,
    count,
    isVoid = false,
    showCounts = true,
    onclick,
    disabled: disabledProp = false
  }: {
    listingIndex: number
    folder?: TripFolder
    count?: number
    isVoid?: boolean
    showCounts?: boolean
    onclick: () => void
    disabled?: boolean
  } = $props()

  // showCount == false indicates that we are in create trip modal
  let disabled = $derived(disabledProp || (showCounts && count === 0))

  let title = folder?.title ?? "THE VOID"

  //   const image = folder?.image
  //   const imageUrl = image ? (urlFor(image) as ImageUrlBuilder).width(300).auto("format").url() : ""
  //   const style = imageUrl ? `background-image: url(${imageUrl});` : ""

  const onmousedown = () => {
    playSound("ratfunUI", "smallButtonDown")
  }

  const onmouseup = () => {
    playSound("ratfunUI", "smallButtonUp")
  }
</script>

<div class="tile" in:fade|global={{ duration: 100, delay: listingIndex * 30 }}>
  <button class:disabled class:void={isVoid} {onclick} {onmouseup} {onmousedown}>
    <div class="title">
      {title}
      <span class="count">
        {#if showCounts}
          <br />
          {#if isVoid}
            (All other trips)
          {:else}
            {count ?? 0} trip{count === 1 ? "" : "s"}
          {/if}
        {/if}
      </span>
    </div>
  </button>
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
      border-color: rgba(0, 0, 0, 0.5);
      color: black;

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .title {
        .count {
          font-size: var(--font-size-normal);
        }
      }

      &:hover {
        border-color: rgba(0, 0, 0, 0.3);
      }

      &:active {
        filter: invert(1);
      }

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(100%);
      }
    }
  }
</style>
