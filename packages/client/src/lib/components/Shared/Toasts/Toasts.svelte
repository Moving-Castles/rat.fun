<script lang="ts">
  import { slide } from "svelte/transition"
  import { toastManager } from "$lib/modules/ui/toasts.svelte"
  import { playSound } from "$lib/modules/sound"

  const onToastClick = (id: string) => {
    toastManager.remove(id)
  }
</script>

{#if toastManager.toasts.length > 0}
  <div class="toasts-container">
    {#each toastManager.toasts as toast (toast.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        onintrostart={() => {
          if (toast.type === "error") {
            playSound("ratfun", "mouseupdanger")
          }
        }}
        transition:slide|global
        class="toast toast-{toast.type}"
        onclick={() => onToastClick(toast.id)}
      >
        <div class="toast-content">
          {toast.message.length > 160 ? toast.message.substring(0, 160) + "..." : toast.message}
        </div>
        <div class="toast-close">×</div>
      </div>
    {/each}
  </div>
{/if}

<style lang="scss">
  .toasts-container {
    position: fixed;
    bottom: calc(var(--default-padding) * 2);
    right: calc(var(--default-padding) * 2);
    z-index: var(--z-top);
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    background: var(--background);
    border: var(--default-border-style);
    padding: 12px 16px;
    width: 400px;
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-small);
    line-height: var(--font-size-small);
    color: var(--foreground);
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    transition: all 0.2s ease;
    overflow: hidden;

    &:hover {
      opacity: 0.8;
    }

    &.toast-error {
      border-color: var(--color-alert-priority);
      background: var(--background);
    }

    &.toast-success {
      border-color: var(--color-success);
      background: var(--background);
    }

    &.toast-warning {
      border-color: var(--color-alert);
      background: var(--background);
    }

    &.toast-info {
      border-color: var(--color-grey-mid);
      background: var(--background);
    }
  }

  .toast-content {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    font-size: var(--font-size-medium);
    line-height: 1;
    opacity: 0.6;
    user-select: none;
    position: absolute;
    z-index: 1;
  }
</style>
