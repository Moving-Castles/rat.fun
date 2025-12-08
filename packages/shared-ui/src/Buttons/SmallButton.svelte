<script lang="ts">
  import { Tooltip } from "../Tooltip"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    extraClass = "",
    isPhone = false,
    onmousedown,
    onmouseup,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    extraClass?: string
    isPhone?: boolean
    onmousedown?: () => void
    onmouseup?: (e: MouseEvent) => void
    onclick?: (e: MouseEvent) => void
  } = $props()

  const handleMousedown = () => {
    onmousedown?.()
  }

  const handleMouseup = (e: MouseEvent) => {
    if (!disabled) {
      onmouseup?.(e)
      onclick?.(e)
    }
  }
</script>

<Tooltip content={tippyText} {isPhone}>
  <button class={extraClass} class:disabled onmouseup={handleMouseup} onmousedown={handleMousedown}>
    <span class="button-text">{text}</span>
    {#if cost}
      <span class="button-cost">({cost})</span>
    {/if}
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-light);
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: var(--background-light-transparent);
    .button-text {
      font-size: var(--font-size-normal);
      font-family: var(--special-font-stack);
      line-height: 1em;
      color: var(--background);
    }

    .button-cost {
      font-size: var(--font-size-normal);
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
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
