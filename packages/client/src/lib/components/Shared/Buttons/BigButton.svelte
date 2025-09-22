<script lang="ts">
  import { playUISound } from "$lib/modules/sound/state.svelte"
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
    playUISound("ratfun", "mousedown")
  }

  let conditionalAction = $derived(tippyText ? tippy : () => {})

  const onmouseup = () => {
    playUISound("ratfun", "mouseup")
    onclick()
  }
</script>

<button class:disabled {onmouseup} {onmousedown} use:conditionalAction={{ content: tippyText }}>
  <span class="button-text">{text}</span>
  {#if cost}
    <span class="button-cost">(${cost})</span>
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
      font-size: var(--font-size-normal);
      font-family: var(--label-font-stack);
    }

    .button-cost {
      font-size: var(--font-size-normal);
    }

    &:hover {
      background: var(--color-alert-priority-light);
    }

    &:active {
      border-style: inset;
      background: var(--color-alert-priority-muted);
      transform: translateY(2px);
      position: relative;
      color: white;
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }
  }
</style>
