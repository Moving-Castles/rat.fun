<script lang="ts">
  import { onMount } from "svelte"
  import { ENVIRONMENT } from "@mud/enums"

  import OperatorBar from "@components/Main/OperatorBar.svelte"
  import FloorBar from "@components/Main/FloorBar.svelte"
  import LeftContainer from "@components/Main/LeftContainer.svelte"
  import RightContainer from "@components/Main/RightContainer.svelte"

  export let environment: ENVIRONMENT | null = null

  onMount(() => {
    console.log("Main component mounted")
  })
</script>

<div class="main">
  <OperatorBar />
  <div class="main-area">
    <LeftContainer />
    <FloorBar />
    <RightContainer />
  </div>
</div>

<style>
  .main {
    position: fixed;
    top: 10px;
    left: 10px;
    height: calc(100vh - 20px);
    width: calc(100vw - 20px);
    overflow: hidden;
    border: 1px solid white;
  }

  .main-area {
    width: 100%;
    display: flex;
    flex-direction: row;
  }
</style>
