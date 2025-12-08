<script lang="ts">
  import { ResizableText } from "$lib/components/Shared"
  import { renderSafeString } from "$lib/modules/utils"
  const { trip }: { trip: Trip } = $props()
</script>

<div class="trip-preview-prompt">
  <!-- <div class="content"> -->
  <ResizableText options={{ maxFontPixels: 60 }}>
    {renderSafeString(trip.prompt)}
  </ResizableText>
  <!-- </div> -->
</div>

<style lang="scss">
  .trip-preview-prompt {
    border-bottom: var(--default-border-style);
    word-break: break-word; /* Break long words if needed */
    overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
    width: 100%;
    font-family: var(--special-font-stack);
    height: 100%;
    line-height: 1;
    padding: 8px 20px 40px 8px;

    .content {
      max-width: 55ch;
      padding-bottom: 10px;
      padding-inline: 10px;

      @media screen and (min-width: 800px) {
        padding-top: 20px;
        padding-bottom: 10px;
        padding-inline: 10px;
      }

      &.short {
        font-size: var(--font-size-normal);
      }

      &.medium {
        font-size: var(--font-size-normal);
      }

      &.long {
        font-size: var(--font-size-normal);
      }

      &.extra-long {
        font-size: var(--font-size-normal);
      }
    }
  }
</style>
