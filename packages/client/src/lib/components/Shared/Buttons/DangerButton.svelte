<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"

  let {
    text,
    tippyText,
    disabled = false,
    onclick
  }: {
    text: string
    tippyText?: string
    disabled?: boolean
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    playSound("ratfunUI", "bigButtonDown")
  }

  const onmouseup = () => {
    playSound("ratfunUI", "bigButtonUp")
    onclick()
  }
</script>

<Tooltip content={tippyText}>
  <button class:disabled {onmouseup} {onmousedown}>
    <span class="button-text">{text}</span>
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    border: none;
    border-style: outset;
    border-width: 10px;
    border-color: rgba(0, 0, 0, 0.5);
    background: var(--color-alert-priority);

    .button-text {
      font-size: var(--font-size-normal);
      font-family: var(--label-font-stack);
    }

    &:hover {
      background: var(--color-death);
    }

    &:active {
      border-style: inset;
      background: var(--color-alert-priority-muted);
      transform: translateY(2px);
      position: relative;
      color: white;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
