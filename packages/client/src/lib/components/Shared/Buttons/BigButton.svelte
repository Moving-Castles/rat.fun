<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { tippy } from "svelte-tippy"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    playSound("ratfun", "mousedown")
  }

  let conditionalAction = $derived(tippyText ? tippy : () => {})

  const onmouseup = () => {
    playSound("ratfun", "mouseup")
    onclick()
  }
</script>

<button class:disabled {onmouseup} {onmousedown} use:conditionalAction={{ content: tippyText }}>
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
    border-width: 10px;
    border-color: rgba(0, 0, 0, 0.5);

    .button-text {
      letter-spacing: -0.2em;
      font-size: var(--font-size-extra-large);
      font-family: var(--label-font-stack);
    }

    .button-cost {
      font-size: var(--font-size-normal);
    }

    &:hover {
      background: var(--color-alert-priority-light);
    }

    &:active {
      background: var(--color-alert-priority-muted);
      border-style: inset;
      transform: translateY(2px);
      position: relative;
      // border-width: 8px;
      // top: -2px;
      color: white;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
