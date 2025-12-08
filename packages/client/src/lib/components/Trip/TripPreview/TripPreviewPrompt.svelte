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
    word-break: break-word;
    overflow-wrap: anywhere;
    width: 100%;
    font-family: var(--special-font-stack);
    height: 100%;
    padding: 8px 8px 20px;

    @media screen and (min-width: 800px) {
      padding: 8px 20px 60px;
    }
  }
</style>
