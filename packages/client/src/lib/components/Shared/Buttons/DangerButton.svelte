<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { tippy } from "svelte-tippy"

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
    playSound("ratfun", "mousedown")
  }

  const onmouseup = () => {
    playSound("ratfun", "mouseupdanger")
    onclick()
  }

  let conditionalAction = $derived(tippyText ? tippy : () => {})
</script>

<button class:disabled {onmouseup} {onmousedown} use:conditionalAction={{ content: tippyText }}>
  <span class="button-text">{text}</span>
</button>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    border: none;
    border-style: outset;
    border-width: 7px;
    border-color: rgba(0, 0, 0, 0.5);

    background: var(--color-death);

    .button-text {
      letter-spacing: -0.2em;
      font-size: 32px;
      font-family: var(--label-font-stack);
    }

    &:hover {
      background: var(--color-death);
    }

    &:active {
      border-style: inset;
      transform: translateY(2px);
      border-width: 5px;
      position: relative;
      top: -2px;
      color: white;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
