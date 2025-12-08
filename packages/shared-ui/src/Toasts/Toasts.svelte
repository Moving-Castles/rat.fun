<script lang="ts">
  import { slide, fade } from "svelte/transition"

  export interface Toast {
    id: string
    message: string
    type?: string
  }

  let {
    toasts,
    onRemove
  }: {
    toasts: Toast[]
    onRemove: (id: string) => void
  } = $props()

  const onToastClick = (id: string) => {
    onRemove(id)
  }
</script>

{#if toasts.length > 0}
  <div class="toasts-container">
    {#each toasts as toast (toast.id)}
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
      border-color: var(--color-toast-error, var(--color-bad));
    }

    &.toast-warning {
      border-color: var(--color-toast-warning, var(--color-neutral));
    }

    &.toast-info {
      border-color: var(--color-toast-info, var(--color-grey-mid));
    }

    &.toast-success {
      border-color: var(--color-toast-success, var(--color-good));
    }

    &.toast-player-notification {
      font-size: var(--font-size-normal);
      border-color: var(--color-toast-player-notification);
    }

    &.toast-trip-notification {
      font-size: var(--font-size-normal);
      border-color: var(--color-toast-trip-notification);
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
