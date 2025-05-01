<script lang="ts">
  import YourRat from "@components/Main/RatContainer/YourRat/YourRat.svelte"
</script>

<div class="rat-container">
  <YourRat />
</div>

<style lang="scss">
  .rat-container {
    width: calc(50% - (var(--floor-bar-width) / 2));
    border-bottom: var(--default-border-style);
  }
</style>
