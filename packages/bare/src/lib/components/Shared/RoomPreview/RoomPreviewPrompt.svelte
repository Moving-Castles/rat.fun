<script lang="ts">
  import { renderSafeString } from "$lib/modules/utils"
  const { room }: { room: Room } = $props()

  function getPromptLengthClass(prompt: string) {
    const length = prompt.length
    if (length > 200) return "extra-long"
    if (length > 100) return "long"
    if (length > 50) return "medium"
    return "short"
  }
</script>

<div class="room-preview-prompt">
  <div class="content {getPromptLengthClass(room.prompt)}">
    {renderSafeString(room.prompt)}
  </div>
</div>

<style lang="scss">
  .room-preview-prompt {
    border-bottom: 1px solid var(--color-grey-mid);
    word-break: break-word; /* Break long words if needed */
    overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
    width: 100%;
    font-family: var(--special-font-stack);
    background: var(--color-alert);
    min-height: 200px;
    background: url("/images/texture-2.png");

    .content {
      max-width: 55ch;
      padding-top: 20px;
      padding-bottom: 10px;
      padding-inline: 10px;

      &.short {
        font-size: var(--font-size-extra-large);
      }

      &.medium {
        font-size: var(--font-size-large);
      }

      &.long {
        font-size: var(--font-size-large);
      }

      &.extra-long {
        font-size: var(--font-size-medium);
      }
    }
  }
</style>
