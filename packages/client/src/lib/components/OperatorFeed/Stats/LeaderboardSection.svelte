<script lang="ts">
  import { SlideToggle } from "$lib/components/Shared"

  let {
    title,
    toggleOptions,
    toggleValue,
    onToggleChange,
    children
  }: {
    title: string
    toggleOptions?: { value: string; label: string }[]
    toggleValue?: string
    onToggleChange?: (value: string) => void
    children: import("svelte").Snippet
  } = $props()
</script>

<div class="leaderboard-section">
  <div class="section-header">
    <span class="section-title">{title}</span>
    {#if toggleOptions && toggleValue && onToggleChange}
      <div class="toggle-wrapper">
        <SlideToggle
          options={toggleOptions}
          value={toggleValue}
          onchange={onToggleChange}
          compact
        />
      </div>
    {/if}
  </div>
  <div class="section-content">
    {@render children()}
  </div>
</div>

<style lang="scss">
  .leaderboard-section {
    border-bottom: var(--default-border-style);

    &:last-child {
      border-bottom: none;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-grey-dark);
    background: var(--background);
    gap: 12px;

    @media (max-width: 800px) {
      padding: 10px 12px;
      flex-wrap: wrap;
    }
  }

  .section-title {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toggle-wrapper {
    width: 260px;
    flex-shrink: 0;
  }

  .section-content {
    max-height: 200px;
    overflow-y: auto;
  }
</style>
