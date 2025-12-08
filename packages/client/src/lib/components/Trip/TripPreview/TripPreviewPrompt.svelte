<script lang="ts">
  import { renderSafeString } from "$lib/modules/utils"
  import { ResizableText } from "$lib/components/Shared"

  const { trip }: { trip: Trip } = $props()
</script>

<div class="trip-preview-prompt">
  <ResizableText>
    {renderSafeString(trip.prompt)}
  </ResizableText>
</div>

<style lang="scss">
  .trip-preview-prompt {
    word-break: break-word; /* Break long words if needed */
    overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
    width: 100%;
    font-family: var(--special-font-stack);
    // background: var(--background-dark-transparent);
    height: 100%;
    padding: 8px 20px 60px;

    .content {
      max-width: 55ch;
      padding-top: 20px;
      padding-bottom: 10px;
      padding-inline: 10px;
      line-height: 0.9em;

      &.short {
        // font-size: var(--font-size-extra-large);
      }

      &.medium {
        // font-size: var(--font-size-extra-large);
      }

      &.long {
        // font-size: var(--font-size-large);
      }

      &.extra-long {
        // font-size: var(--font-size-normal);
      }
    }
  }
</style>
