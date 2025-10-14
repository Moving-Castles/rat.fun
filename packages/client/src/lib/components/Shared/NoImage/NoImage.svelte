<script lang="ts">
  import { SmallSpinner } from "$lib/components/Shared"
</script>

<div class="no-image">
  <div class="no-image-text">
    <div>IMAGE LOADING</div>
    <div>
      <SmallSpinner />
    </div>
  </div>
</div>

<style lang="scss">
  .no-image {
    width: 100%;
    height: 100%;
    aspect-ratio: 1/1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-size: var(--font-size-small);

    .no-image-text {
      display: flex;
      align-items: center;
      gap: 1ch;
    }
  }
</style>
