<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { tippy } from "svelte-tippy"

  let {
    text,
    tippyText,
    disabled = false,
    onclick,
  }: {
    text: string
    tippyText?: string
    disabled?: boolean
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    playSound("tcm", "TRX_wait_b")
  }

  const onmouseup = () => {
    playSound("tcm", "selectionEnter")
    onclick()
  }
</script>

<button
  class:disabled
  {onmouseup}
  {onmousedown}
  use:tippy={{ content: tippyText }}
>
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

    background: repeating-linear-gradient(
      45deg,
      #cc0000,
      #cc0000 20px,
      #9e0000 20px,
      #9e0000 40px
    );

    .button-text {
      letter-spacing: -0.2em;
      font-size: 32px;
      font-family: var(--label-font-stack);
    }

    &:hover {
      background: repeating-linear-gradient(
        45deg,
        #cc0000,
        #cc0000 20px,
        #9e0000 40px,
        #9e0000 20px
      );
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
