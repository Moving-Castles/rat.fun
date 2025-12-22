<script lang="ts">
  import { playSound } from "$lib/modules/sound"

  let {
    text,
    onclick
  }: {
    text: string
    onclick: (e: MouseEvent) => void
  } = $props()

  const handleMousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const handleMouseup = (e: MouseEvent) => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
    onclick(e)
  }
</script>

<button onmousedown={handleMousedown} onmouseup={handleMouseup}>
  {text}
</button>

<style lang="scss">
  button {
    width: 100%;
    height: 100%;
    color: var(--color-grey-darker);
    background: #90d0b4;
    border: none;
    border-style: outset;
    border-width: 10px;
    border-color: var(--background-light-transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-large);
    font-family: var(--special-font-stack);
    line-height: 1em;
    cursor: pointer;

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      border-style: inset;
      transform: translateY(2px);
    }
  }
</style>
