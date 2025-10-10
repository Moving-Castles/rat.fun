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
    border-bottom: 1px solid var(--color-grey-mid);
    word-break: break-word; /* Break long words if needed */
    overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
    width: 100%;
    font-family: var(--special-font-stack);
    // background: var(--color-alert);
    height: 100%;
    // background: url("/images/texture-2.png");

    .content {
      max-width: 55ch;
      padding-top: 20px;
      padding-bottom: 10px;
      padding-inline: 10px;

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
