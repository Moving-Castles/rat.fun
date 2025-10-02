<script lang="ts">
  // import { playUISound } frosm "$lib/modules/sound/state.svelte"
  import { playSound } from "$lib/modules/sound-classic"
  import { tippy } from "svelte-tippy"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    id,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    id?: string
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    if (id === "connect") {
      playSound("ratfun", "clickDownLight")
    } else {
      playSound("ratfun", "clickDownHeavy")
    }
  }

  let conditionalAction = $derived(tippyText ? tippy : () => {})

  const onmouseup = () => {
    if (id === "send_rat" || id === "buy_rat") {
      playSound("ratfun", "releaseConnect")
    } else if (id === "skillz") {
      playSound("ratfun", "releaseConnect")
    } else if (id === "connect") {
      playSound("ratfun", "releaseConnect")
    } else if (id === "abort") {
      playSound("ratfun", "releaseError1")
    } else if (id === "liquidate") {
      playSound("ratfun", "releaseSlopCharge")
    } else {
      playSound("ratfun", "releaseMini")
    }
    onclick()
  }
</script>

<button class:disabled {onmouseup} {onmousedown} use:conditionalAction={{ content: tippyText }}>
  <span class="button-text">{text}</span>
  {#if cost}
    <span class="button-cost">({CURRENCY_SYMBOL}{cost})</span>
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
