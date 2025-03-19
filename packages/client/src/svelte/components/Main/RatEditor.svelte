<script lang="ts">
  import { onMount } from "svelte"

  onMount(() => {
    console.log("RatEditor mounted")
  })
</script>

<div class="rat-editor">RAT EDITOR</div>

<style lang="scss">
  .rat-editor {
    border-bottom: 1px solid white;
    height: 240px;
    padding: 20px;
  }
</style>
