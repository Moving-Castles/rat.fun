<script lang="ts">
  import { onMount } from "svelte"
  import RatEditor from "./RatEditor.svelte"
  import RatCam from "./RatCam.svelte"
  onMount(() => {
    console.log("LeftContainer component mounted")
  })
</script>

<div class="left-container">
  <div class="pane-switch">
    <div class="pane-switch-item selected">YOUR RAT</div>
    <div class="pane-switch-item">YOUR ROOMS</div>
  </div>
  <RatEditor />
  <RatCam />
  <div class="liquidate">LIQUIDATE RAT</div>
</div>

<style>
  .left-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
  }

  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid white;
    height: 60px;
    line-height: 60px;
  }

  .pane-switch-item {
    text-align: center;
    padding-inline: 20px;
    border-right: 1px solid white;

    &.selected {
      background: rgb(126, 126, 126);
      color: white;
    }
  }

  .liquidate {
    padding-inline: 20px;
    height: 100%;
    line-height: 60px;
  }
</style>
