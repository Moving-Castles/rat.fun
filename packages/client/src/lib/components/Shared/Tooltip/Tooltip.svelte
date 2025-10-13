<script lang="ts">
  import { tippy } from "svelte-tippy"
  import type { Props } from "tippy.js"

  let {
    content,
    props = {},
    svg = false,
    children
  }: {
    content?: string
    props?: Partial<Props>
    svg?: boolean
    children: Snippet
  } = $props()

  let conditionalAction = $derived(content ? tippy : () => {})
  let tippyOptions = $derived({ content, ...props })
</script>

{#if svg}
  <g use:conditionalAction={tippyOptions}>
    {@render children()}
  </g>
{:else}
  <span use:conditionalAction={tippyOptions}>
    {@render children()}
  </span>
{/if}

<style lang="scss">
  span,
  g {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
