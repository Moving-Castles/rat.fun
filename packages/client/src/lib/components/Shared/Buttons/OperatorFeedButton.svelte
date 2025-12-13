<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { onlinePlayers, websocketConnected } from "$lib/modules/off-chain-sync/stores"

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

  const onlineCount = $derived($onlinePlayers.length)

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
    <span class="indicator" class:connected={$websocketConnected}></span>
    <span class="button-text">OPERATOR FEED ({onlineCount})</span>
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-light);
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
      background: var(--color-down);
      transition: background 0.2s ease;

      &.connected {
        background: var(--color-up);
      }
    }

    .button-text {
      font-size: var(--font-size-small);
      font-family: var(--typewriter-font-stack);
      line-height: 1em;
      z-index: 2;
      position: relative;
      color: var(--color-grey-darker);
    }

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      border-style: inset;
      background: var(--color-grey-mid);
      transform: translateY(2px);
      position: relative;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }

    &.active {
      border-style: inset;
      background: var(--color-grey-mid);
    }
  }
</style>
