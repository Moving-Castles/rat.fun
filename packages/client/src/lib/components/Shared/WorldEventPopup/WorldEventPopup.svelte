<script lang="ts">
  import { activeWorldEvent, activeWorldEventContent } from "$lib/modules/state/stores"
  import { urlFor } from "$lib/modules/content/sanity"
</script>

{#if $activeWorldEventContent}
  <div class="world-event">
    <div class="image-container">
      <h1 class="world-event-title">{$activeWorldEventContent?.title}</h1>
      <img
        src={urlFor($activeWorldEventContent?.image ?? "")
          ?.width(500)
          ?.url() ?? ""}
        alt={$activeWorldEventContent?.title}
      />
    </div>
    <p class="world-event-prompt">
      {$activeWorldEvent?.prompt}
    </p>
  </div>
  <div class="pulse"></div>
{/if}

<style lang="scss">
  .world-event {
    background: var(--color-alert-priority);
    padding: 1rem 1rem;
    position: relative;
    z-index: 20;

    .image-container {
      position: relative;
    }

    .world-event-title {
      font-family: var(--special-font-stack);
      font-size: var(--font-size-normal);
      font-weight: normal;
      z-index: 40;
      position: absolute;
      background: var(--color-alert-priority-muted);
      padding: 10px 5px;
      left: 50%;
      top: 50%;
      margin: 0;
      transform: translate(-50%, -50%) rotate(3deg);
    }

    .world-event-prompt {
      color: var(--color-grey-darker);
      text-align: center;
    }
  }
  .pulse {
    animation: warn 3s ease infinite;
    position: fixed;
    inset: 0;
    z-index: 20;
  }

  @keyframes warn {
    0%,
    100% {
      background-color: rgba(255, 0, 0, 0.2);
    }
    50% {
      background-color: rgba(255, 0, 0, 0);
    }
  }
</style>
