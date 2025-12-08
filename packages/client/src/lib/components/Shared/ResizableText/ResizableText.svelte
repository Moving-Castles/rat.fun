<script lang="ts">
  let { children, options = {} } = $props()
  const DEFAULTS = { maxFontPixels: 40 }
  import { resizeTextAttachment } from "$lib/modules/ui"
</script>

<div {@attach element => resizeTextAttachment(element, { ...DEFAULTS, ...options })} class="parent">
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
