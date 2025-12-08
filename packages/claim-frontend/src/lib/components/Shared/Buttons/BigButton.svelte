<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { ShaderLocal } from "$lib/components/Shared"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    extraBig = false,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    extraBig?: boolean
    id?: string
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
  <button class:disabled class:extraBig {onmouseup} {onmousedown}>
    <div class="button-content">
      <span class="button-text">{text}</span>
      {#if cost}
        <span class="button-cost">({CURRENCY_SYMBOL}{cost})</span>
      {/if}
    </div>
    <div class="canvas-container">
      <ShaderLocal shaderKey="plasma" />
    </div>
  </button>
</Tooltip>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-light);
    border: none;
    border-style: outset;
    border-width: 10px;
    border-color: var(--background-light-transparent);
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    border-radius: 40px;

    .button-content {
      z-index: 2;
      position: relative;
      color: white;

      .button-text {
        font-size: var(--font-size-extra-large);
        font-family: var(--special-font-stack);
        line-height: 1em;
      }

      .button-cost {
        font-size: var(--font-size-normal);
      }
    }

    .canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      border-radius: 40px;
      overflow: hidden;

      // opacity: 0.5;
    }

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      border-style: inset;
      background: var(--color-grey-mid);
      transform: translateY(2px);
      position: relative;
      color: white;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }

    &.extraBig {
      .button-content {
        .button-text {
          font-size: var(--font-size-super-large);
        }
      }
    }
  }
</style>
