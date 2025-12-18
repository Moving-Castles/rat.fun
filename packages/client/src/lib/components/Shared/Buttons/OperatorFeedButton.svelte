<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, X } from "$lib/components/Shared"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"

  let {
    isActive,
    tippyText,
    disabled = false,
    onclick
  }: {
    isActive: boolean
    tippyText?: string
    disabled?: boolean
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "bigButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "bigButtonUp" })
    onclick()
  }
</script>

<Tooltip content={tippyText}>
  <button class:disabled class:active={isActive} {onmouseup} {onmousedown}>
    {#if isActive}
      <div class="button-icon">
        <X />
        <X />
        <X />
        <X />
      </div>
    {:else}
      <span class="indicator" class:connected={$websocketConnected}></span>
      <span class="button-text">OPERATOR FEED</span>
    {/if}
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-darker);
    border: none;
    border-style: outset;
    border-width: 5px;
    border-color: var(--background-light-transparent);
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: -3px;
      background: var(--color-down);
      transition: background 0.2s ease;

      &.connected {
        background: var(--color-up);
      }
    }

    .button-text {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      line-height: 1em;
      z-index: 2;
      position: relative;
      color: var(--color-grey-lighter);
    }

    .button-icon {
      width: 100%;
      height: 60%;
      color: var(--color-grey-dark);
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    &:hover {
      background: var(--color-grey-dark);
    }

    &:active {
      border-style: inset;
      transform: translateY(2px);
      position: relative;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }

    &.active {
      background: var(--color-grey-light);

      &:hover {
        background: var(--color-grey-lighter);
      }

      &:active {
        border-style: inset;
        background: var(--color-grey-mid);
      }
    }
  }
</style>
