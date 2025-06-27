<script lang="ts">
  import OperatorInfo from "./OperatorInfo.svelte"
  import PaneSwitch from "./PaneSwitch.svelte"
</script>

<div class="top-bar">
  <OperatorInfo />
  <PaneSwitch />
</div>

<style lang="scss">
  .top-bar {
    width: 100%;
    max-width: 100%;
    border-bottom: var(--default-border-style);
    display: flex;
    justify-content: space-between;
    height: var(--operator-bar-height);
    background: var(--black);
    user-select: none;
    overflow-y: hidden;
    overflow-x: scroll;
    grid-column: 1 / span 3;
    display: flex;
  }
</style>
