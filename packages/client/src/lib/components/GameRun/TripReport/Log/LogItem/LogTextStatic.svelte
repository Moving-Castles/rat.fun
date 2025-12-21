<script lang="ts">
  import { parseLogText } from "./parseLogText"
  import { KNOWN_TAGS, TAG_CLASS_MAP, type KnownTag } from "./logTextConfig"

  let { text }: { text: string } = $props()

  const segments = $derived(parseLogText(text, [...KNOWN_TAGS]))
</script>

<div class="log-text">
  {#each segments as segment}
    {#if segment.type === "plain"}
      <span>{segment.text}</span>
    {:else}
      <span class={TAG_CLASS_MAP[segment.type as KnownTag]}>{segment.text}</span>
    {/if}
  {/each}
</div>

<style lang="scss">
  .log-text {
    display: inline-block;
    background: var(--foreground-semi-transparent);
    max-width: 100%;
    padding: 5px;
    color: var(--background);
    line-height: 1.4em;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    word-wrap: break-word;
    overflow-wrap: break-word;

    :global(.item-ref) {
      background: var(--color-log-text-item);
      padding: 2px 4px;
    }

    :global(.quote) {
      background: var(--color-log-text-quote);
      padding: 2px 4px;
    }

    :global(.system-message) {
      background: var(--color-log-text-system);
      padding: 2px 4px;
    }

    :global(.balance-message) {
      background: var(--color-log-text-balance);
      padding: 2px 4px;
    }

    @media (max-width: 768px) {
      font-size: var(--font-size-normal);
    }
  }
</style>
