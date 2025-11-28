<script lang="ts">
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
</script>

<div class="no-rat-warning">
  <span>{UI_STRINGS.noRatWarning}</span>
</div>

<style lang="scss">
  .no-rat-warning {
    background: rgba(255, 0, 0, 0.8);
    color: var(--foreground);
    text-align: center;
    height: 100%;
    line-height: 80px;
    user-select: none;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-large);
  }
</style>
