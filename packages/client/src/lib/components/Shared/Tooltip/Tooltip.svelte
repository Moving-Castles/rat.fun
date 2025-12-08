<script lang="ts">
  import { Tooltip as BaseTooltip } from "@ratfun/shared-ui/Tooltip"
  import type { Props } from "tippy.js"
  import type { Snippet } from "svelte"
  import { isPhone } from "$lib/modules/ui/state.svelte"

  let {
    content,
    props = {},
    svg = false,
    allowHTML = false,
    children
  }: {
    content?: string
    props?: Partial<Props>
    allowHTML?: boolean
    svg?: boolean
    children: Snippet
  } = $props()
</script>

<BaseTooltip {content} {props} {svg} {allowHTML} isPhone={$isPhone}>
  {@render children()}
</BaseTooltip>
