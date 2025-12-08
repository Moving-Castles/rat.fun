<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { ShaderLocal, ResizableText } from "$lib/components/Shared"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

  export type BigButtonType =
    | "default"
    | "abort"
    | "confirm"
    | "danger"
    | "cash_out"
    | "buy_rat"
    | "create_trip"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    extraBig = false,
    type = "default",
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    extraBig?: boolean
    type?: BigButtonType
    onclick: () => void
  } = $props()

  const shaderKeyMap: Record<BigButtonType, keyof typeof shaders> = {
    default: "plasma",
    abort: "plasmaOptimized",
    confirm: "plasmaOptimizedGreen",
    danger: "plasmaOptimized",
    cash_out: "starfield",
    buy_rat: "plasmaLamp",
    create_trip: "plasma"
  }

  let shaderKey = $derived(shaderKeyMap[type])

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "bigButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "bigButtonUp" })
    onclick()
  }
</script>

<Tooltip content={tippyText}>
  <button class="type-{type}" class:disabled class:extraBig {onmouseup} {onmousedown}>
    <div class="button-content">
      <span class="button-text">{text}</span>
      {#if cost}
        <span class="button-cost">({cost} {CURRENCY_SYMBOL})</span>
      {/if}
    </div>
    <div class="canvas-container">
      <ShaderLocal {shaderKey} />
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
        font-size: var(--font-size-extra-large);
        font-family: var(--special-font-stack);
        line-height: 1em;
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

    &:active {
      border-style: inset;
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

    /* Button types */
    &.type-default {
      background: var(--color-grey-light);
      &:hover {
        background: var(--color-grey-lighter);
      }
      &:active {
        background: var(--color-grey-mid);
      }
    }

    &.type-abort {
      border-radius: 20px;
      background: var(--color-bad);
      &:hover {
        background: var(--color-bad-light);
      }
      &:active {
        background: var(--color-bad-muted);
      }
      .canvas-container {
        border-radius: 20px;
      }
    }

    &.type-confirm {
      border-radius: 20px;
      background: var(--color-good);
      &:hover {
        background: var(--color-good-light);
      }
      &:active {
        background: var(--color-good-muted);
      }
      .canvas-container {
        border-radius: 20px;
      }
    }

    &.type-danger {
      background: var(--color-bad);
      &:hover {
        background: var(--color-bad-light);
      }
      &:active {
        background: var(--color-bad-muted);
      }
    }

    &.type-cash_out {
      &:hover {
        background: var(--color-bad-light);
      }
      &:active {
        background: var(--color-bad-muted);
      }
    }

    &.type-buy_rat {
      background: var(--color-grey-light);
      &:hover {
        background: var(--color-grey-lighter);
      }
      &:active {
        background: var(--color-grey-mid);
      }
    }

    &.type-create_trip {
      background: var(--color-grey-light);
      &:hover {
        background: var(--color-grey-lighter);
      }
      &:active {
        background: var(--color-grey-mid);
      }
    }
  }
</style>
