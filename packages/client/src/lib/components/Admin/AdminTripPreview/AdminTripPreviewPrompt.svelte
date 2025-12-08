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
    word-break: break-word;
    overflow-wrap: anywhere;
    width: 100%;
    font-family: var(--special-font-stack);
    height: 100%;
    line-height: 1;
    padding: 8px 20px 40px 8px;
  }
</style>
