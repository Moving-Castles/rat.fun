<script lang="ts">
  import { activeWorldEvent } from "$lib/modules/state/stores"
</script>

<div class="world-event">
  <p>ALERT!!! {$activeWorldEvent?.title}:<br /> {$activeWorldEvent?.prompt}</p>
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
    background: rgba(255, 0, 0, 0.5);
  }
</style>
