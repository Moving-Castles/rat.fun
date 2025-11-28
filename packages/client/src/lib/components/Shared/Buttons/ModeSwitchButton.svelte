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
  <button class:disabled {onmouseup} {onmousedown}>
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
  button {
    width: 100%;
    height: 100%;
    background: var(--color-alert-priority);
    border: none;
    border-style: outset;
    border-width: 5px;
    border-color: rgba(0, 0, 0, 0.3);
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
      color: rgb(54, 54, 54);
    }

    .button-icon {
      width: 100%;
      height: 60%;
      color: rgb(54, 54, 54);
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
      gap: 10px;
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
