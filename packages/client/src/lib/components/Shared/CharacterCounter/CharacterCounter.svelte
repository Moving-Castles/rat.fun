<script lang="ts">
  let {
    currentLength,
    maxLength
  }: {
    currentLength: number
    maxLength: number
  } = $props()
</script>

<span class="counter" class:error={currentLength < 1 || currentLength > maxLength}>
  {currentLength}/{maxLength}
</span>

<style lang="scss">
  .counter {
    font-size: var(--font-size-small);
    padding: 2px;
    &.error {
      background: var(--color-death);
      color: var(--background);
    }
  }
</style>
