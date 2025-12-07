<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"

  let {
    text,
    tippyText,
    disabled = false,
    extraClass = "",
    hidden = true,
    onmouseup,
    onclick
  }: {
    text: string
    tippyText?: string
    disabled?: boolean
    extraClass?: string
    hidden?: boolean
    onmouseup?: (e: MouseEvent) => void
    onclick?: (e: MouseEvent) => void
  } = $props()

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const onmouseupHandler = (e: MouseEvent) => {
    playSound({ category: "ratfunUI", id: "wheelLock" })
    onmouseup?.(e)
    onclick?.(e)
  }
</script>

<Tooltip content={tippyText}>
  <button class:hidden class={extraClass} class:disabled onmouseup={onmouseupHandler} {onmousedown}>
    <span class="button-text">{text}</span>
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100px;
    background: var(--color-grey-light);
    border: none;
    border-style: outset;
    border-width: 8px;
    border-color: var(--background-light-transparent);
    opacity: 1;

    &.hidden {
      opacity: 0;
    }
    .button-text {
      font-size: var(--font-size-large);
      font-family: var(--special-font-stack);
      color: black;

      @media (max-width: 800px) {
        font-size: var(--font-size-normal);
      }
    }

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      background: var(--color-grey-mid);
      border-style: inset;
      transform: translateY(2px);
      border-width: 4px;
      position: relative;
      top: -2px;
      color: var(--foreground);
    }

    &.disabled {
      pointer-events: none;
      cursor: default;

      &:not(.hidden) {
        opacity: 0.5;
      }
    }
  }
</style>
