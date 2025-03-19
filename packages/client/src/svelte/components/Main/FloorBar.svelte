<script lang="ts">
  import { onMount } from "svelte"

  onMount(() => {
    console.log("FloorBar component mounted")
  })
</script>

<div class="floor-bar">
  <div class="floor-item">0</div>
  <div class="floor-item">-1</div>
  <div class="floor-item">-2</div>
  <div class="floor-item">-3</div>
  <div class="floor-item">-4</div>
</div>

<style>
  .floor-bar {
    width: 160px;
    height: calc(100vh - 81px);
    display: flex;
    flex-direction: column;
    border-right: 1px dashed white;
    border-left: 1px dashed white;
  }

  .floor-item {
    width: 100%;
    height: 20%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px dashed white;

    &:last-child {
      border-bottom: none;
    }
  }
</style>
