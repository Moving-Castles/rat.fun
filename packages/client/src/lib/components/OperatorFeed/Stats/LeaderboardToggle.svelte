<script lang="ts">
  let {
    options,
    value,
    onchange
  }: {
    options: { value: string; label: string }[]
    value: string
    onchange: (value: string) => void
  } = $props()
</script>

<div class="leaderboard-toggle">
  {#each options as option}
    <button
      class="toggle-option"
      class:active={value === option.value}
      onclick={() => onchange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style lang="scss">
  .leaderboard-toggle {
    display: flex;
    border: 1px solid var(--color-grey-mid);
  }

  .toggle-option {
    flex: 1;
    padding: 6px 12px;
    background: transparent;
    border: none;
    color: var(--color-grey-light);
    font-size: var(--font-size-tiny);
    font-family: var(--special-font-stack);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s ease;

    &:not(:last-child) {
      border-right: 1px solid var(--color-grey-mid);
    }

    &:hover:not(.active) {
      color: var(--foreground);
    }

    &.active {
      background: var(--foreground);
      color: var(--background);
    }
  }
</style>
