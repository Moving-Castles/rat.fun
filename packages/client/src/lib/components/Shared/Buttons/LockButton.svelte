<script lang="ts">
  import { playSound } from "$lib/modules/sound"

  import { tippy } from "svelte-tippy"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    extraClass = "",
    onmouseup,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    extraClass?: string
    onmouseup?: (e: MouseEvent) => void
    onclick?: (e: MouseEvent) => void
  } = $props()

  const onmousedown = () => {
    playSound("ratfunUI", "smallButtonDown")
  }

  let conditionalAction = $derived(tippyText ? tippy : () => {})

  const onmouseupHandler = (e: MouseEvent) => {
    playSound("ratfunUI", "wheelLock")
    onmouseup?.(e)
    onclick?.(e)
  }
</script>

<button
  class={extraClass}
  class:disabled
  onmouseup={onmouseupHandler}
  {onmousedown}
  use:conditionalAction={{ content: tippyText }}
>
  <span class="button-text">{text}</span>
  {#if cost}
    <span class="button-cost">({cost})</span>
  {/if}
</button>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    background: var(--color-alert-priority);
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: rgba(0, 0, 0, 0.5);

    &.red {
      background: var(--color-death);
    }

    .button-text {
      font-size: var(--font-size-normal);
      font-family: var(--label-font-stack);
    }

    .button-cost {
      font-size: var(--font-size-normal);
    }

    &:hover {
      background: var(--color-alert-priority-light);

      &.red {
        background: var(--color-death-light);
      }
    }

    &:active {
      background: var(--color-alert-priority-muted);
      border-style: inset;
      transform: translateY(2px);
      border-width: 4px;
      position: relative;
      top: -2px;
      color: white;

      &.red {
        background: var(--color-death-muted);
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
