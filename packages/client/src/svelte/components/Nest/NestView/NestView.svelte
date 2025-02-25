<script lang="ts">
  // import { rat } from "@modules/state/base/stores"
  import Cage from "@components/Cage/Cage.svelte"
  import Main from "@components/World/Main.svelte"
</script>

<div class="nest-view">
  <Main>
    <Cage cameraPosition={[0, 0.2, 2]} cameraLookAt={[0, 0.3, 0]} />
  </Main>
</div>

<style lang="scss">
  .nest-view {
    margin-top: 20px;
    background: red;
    width: 100%;
    max-width: 600px;
    height: 400px;
    line-height: 400px;
    text-align: center;
  }
</style>
