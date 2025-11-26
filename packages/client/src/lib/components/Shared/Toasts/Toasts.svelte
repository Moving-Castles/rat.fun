<script lang="ts">
  import { slide, fade } from "svelte/transition"
  import { toastManager } from "$lib/modules/ui/toasts.svelte"

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
        in:slide|global={{ duration: 200 }}
        out:fade|global={{ duration: 200 }}
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
    max-width: 400px;
    min-width: 200px;
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

    @media (max-width: 768px) {
      max-width: 90%;
    }

    &:hover {
      opacity: 0.8;
    }

    &.toast-error {
      border-color: var(--color-alert-priority);
    }

    &.toast-warning {
      border-color: var(--color-alert);
    }

    &.toast-info {
      border-color: var(--color-grey-mid);
    }

    &.toast-player-notification {
      font-size: var(--font-size-normal);
      border-color: var(--color-up);
    }

    &.toast-trip-notification {
      font-size: var(--font-size-normal);
      border-color: var(--color-up);
    }
  }

  .toast-content {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    font-size: var(--font-size-normal);
    line-height: 1;
    opacity: 0.6;
    user-select: none;
    position: absolute;
    z-index: 1;
  }
</style>
