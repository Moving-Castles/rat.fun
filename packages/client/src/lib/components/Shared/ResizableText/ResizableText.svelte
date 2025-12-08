<script lang="ts">
  let { children, options = {} } = $props()
  import { resizeTextAttachment } from "$lib/modules/ui"
</script>

<div {@attach element => resizeTextAttachment(element, options)} class="parent">
  <span>
    {@render children()}
  </span>
</div>

<style>
  .parent {
    width: 100%;
    height: 100%;
  }
</style>
