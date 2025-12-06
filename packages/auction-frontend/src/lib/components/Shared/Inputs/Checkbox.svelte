<script lang="ts">
  let {
    checked = $bindable(false),
    disabled = false,
    ariaLabel = "Toggle checkbox"
  }: {
    checked?: boolean
    disabled?: boolean
    ariaLabel?: string
  } = $props()

  const handleClick = () => {
    if (!disabled) {
      checked = !checked
    }
  }
</script>

<button
  class="checkbox"
  class:checked
  class:disabled
  onclick={handleClick}
  {disabled}
  type="button"
  aria-checked={checked}
  role="checkbox"
  aria-label={ariaLabel}
>
  <span class="dot"></span>
</button>

<style lang="scss">
  .checkbox {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid var(--foreground);
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-grey-mid);
      transition: all 0.15s ease;
    }

    &.checked .dot {
      background: var(--color-up);
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &:hover:not(.disabled) {
      border-color: var(--color-up);
    }
  }
</style>
