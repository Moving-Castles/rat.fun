<script lang="ts">
  let { onclick } = $props()
  import BigButton from "$lib/components/Main/Shared/Buttons/BigButton.svelte"
</script>

<div class="create-room-button">
  <BigButton {onclick} text="Create Room" />
</div>

<style lang="scss">
  .create-room-button {
    height: var(--create-room-button-height);
    display: flex;
    justify-content: center;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background: var(--background);
    overflow: hidden;
  }
</style>
