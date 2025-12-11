<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, X } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    isAdminView,
    tippyText,
    disabled = false,
    onclick
  }: {
    isAdminView: boolean
    tippyText?: string
    disabled?: boolean
    id?: string
    onclick: () => void
  } = $props()

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "bigButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "bigButtonUp" })
    onclick()
  }
</script>

<Tooltip content={tippyText}>
  <button class:disabled class:game-mode={!isAdminView} {onmouseup} {onmousedown}>
    {#if isAdminView}
      <div class="button-icon">
        <X />
        <X />
        <X />
        <X />
      </div>
    {:else}
      <span class="button-text">{UI_STRINGS.admin.toUpperCase()}</span>
    {/if}
  </button>
</Tooltip>

<style lang="scss">
  @keyframes backgroundCycle {
    0% {
      filter: hue-rotate(0deg);
    }
    100% {
      filter: hue-rotate(360deg);
    }
  }

  button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-light);
    border: none;
    border-style: outset;
    border-width: 5px;
    border-color: var(--background-light-transparent);
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

    .button-text {
      font-size: var(--font-size-large);
      font-family: var(--special-font-stack);
      line-height: 1em;
      z-index: 2;
      position: relative;
      color: var(--background);
    }

    .button-icon {
      width: 100%;
      height: 60%;
      color: var(--color-grey-dark);
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
      border-style: inset;
      background: var(--color-grey-mid);
      transform: translateY(2px);
      position: relative;
      color: var(--foreground);
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: default;
    }

    &.game-mode {
      background: radial-gradient(
        circle,
        rgba(255, 0, 0, 1),
        rgba(0, 255, 42, 1),
        rgba(230, 0, 255, 1)
      );
      animation: backgroundCycle 12s infinite;
      filter: hue-rotate(0deg);

      &:hover {
        filter: hue-rotate(0deg) brightness(2);
        background: radial-gradient(
          circle,
          rgba(255, 0, 0, 0.7),
          rgba(0, 255, 42, 0.7),
          rgba(230, 0, 255, 0.7)
        );
      }

      &:active {
        filter: hue-rotate(0deg) brightness(0.9);
      }
    }
  }
</style>
