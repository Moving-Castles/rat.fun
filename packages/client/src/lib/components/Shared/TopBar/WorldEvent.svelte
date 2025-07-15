<script lang="ts">
  import { activeWorldEvent } from "$lib/modules/state/base/stores"
</script>

<div class="world-event">
  <p>ALERT!!! {$activeWorldEvent?.prompt}</p>
</div>

<style lang="scss">
  .world-event {
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: var(--default-border-style);
    height: var(--pane-switch-height);
    width: 400px;
    background: var(--color-grey-mid);
    position: relative;
    background: red;
  }
</style>
