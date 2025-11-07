<script lang="ts">
  import { renderSafeString } from "$lib/modules/utils"
  const { trip }: { trip: Trip } = $props()

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }
</script>

<div class="trip-preview-prompt">
  <div class="content {getPromptLengthClass(trip.prompt)}">
    {renderSafeString(trip.prompt)}
  </div>
</div>

<style lang="scss">
  .trip-preview-prompt {
    word-break: break-word; /* Break long words if needed */
    overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
    width: 100%;
    font-family: var(--special-font-stack);
    background: rgba(0, 0, 0, 0.8);
    height: 100%;

    .content {
      max-width: 55ch;
      padding-top: 20px;
      padding-bottom: 10px;
      padding-inline: 10px;
      line-height: 0.9em;

      &.short {
        font-size: var(--font-size-extra-large);
      }

      &.medium {
        font-size: var(--font-size-extra-large);
      }

      &.long {
        font-size: var(--font-size-large);
      }

      &.extra-long {
        font-size: var(--font-size-normal);
      }
    }
  }
</style>
