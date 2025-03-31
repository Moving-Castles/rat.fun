<script lang="ts">
  let {
    currentLength,
    maxLength,
    minLength,
    label,
  }: {
    currentLength: number
    maxLength: number
    minLength: number
    label: string
  } = $props()
</script>

<div class="counter">
  {currentLength}/{maxLength}
  {#if currentLength < minLength}
    <span class="error">{label} too short (min: {minLength})</span>
  {:else if currentLength > maxLength}
    <span class="error">{label} too long (max: {maxLength})</span>
  {/if}
</div>

<style lang="scss">
  .counter {
    margin-top: 0.25rem;
    font-size: 0.6rem;

    .error {
      color: red;
      margin-left: 0.5rem;
    }
  }
</style>
