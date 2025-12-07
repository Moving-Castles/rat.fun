<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { X } from "$lib/components/Shared"

  let {
    tippyText,
    disabled = false,
    extraClass = "",
    onclick
  }: {
    tippyText?: string
    disabled?: boolean
    extraClass?: string
    onclick?: (e: MouseEvent) => void
  } = $props()

  const onpointerup = (e: MouseEvent) => {
    playSound({ category: "ratfunUI", id: "boing" })
    onclick?.(e)
  }

  const onpointerdown = (e: MouseEvent) => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }
</script>

<Tooltip content={tippyText}>
  <button class={extraClass} class:disabled {onpointerdown} {onpointerup}>
    <div class="button-text">
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
      <X />
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

    .button-text {
      color: var(--color-grey-dark);
      height: 80%;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      background: var(--color-grey-mid);
      border-style: inset;
      transform: translateY(2px);
      border-width: 10px;
      position: relative;
      top: -2px;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
