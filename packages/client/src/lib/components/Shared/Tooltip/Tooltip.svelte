<script lang="ts">
  import { tippy } from "svelte-tippy"
  import type { Props } from "tippy.js"
  import type { Snippet } from "svelte"
  import type { Action } from "svelte/action"
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

  type TippyParams = Parameters<typeof tippy>[1]
  type TippyReturn = ReturnType<typeof tippy>
  type TooltipAction<ElementType extends Element> = Action<ElementType, TippyParams, TippyReturn>
  type TippyInstanceType = NonNullable<TippyReturn>

  const createNoopAction =
    <ElementType extends Element>(): TooltipAction<ElementType> =>
    () => ({
      destroy() {}
    })

  const createTippyAction =
    <ElementType extends Element>(
      caster: (node: ElementType) => HTMLElement
    ): TooltipAction<ElementType> =>
    (node, params) => {
      const instance = tippy(caster(node), params)

      if (!instance) {
        return {
          destroy() {}
        }
      }

      const typedInstance = instance as TippyInstanceType

      return {
        update(newParams) {
          typedInstance.update?.(newParams ?? {})
        },
        destroy() {
          typedInstance.destroy?.()
        }
      }
    }

  const noopHtmlAction = createNoopAction<HTMLElement>()
  const noopSvgAction = createNoopAction<SVGGElement>()
  const htmlTippyAction = createTippyAction<HTMLElement>(node => node)
  const svgTippyAction = createTippyAction<SVGGElement>(node => node as unknown as HTMLElement)

  // Disable tooltips on mobile
  let htmlConditionalAction = $derived<TooltipAction<HTMLElement>>(
    content && !$isPhone ? htmlTippyAction : noopHtmlAction
  )
  // Disable tooltips on mobile
  let svgConditionalAction = $derived<TooltipAction<SVGGElement>>(
    content && !$isPhone ? svgTippyAction : noopSvgAction
  )

  let tippyOptions = $derived({ content, ...props, allowHTML })
</script>

{#if svg}
  <g use:svgConditionalAction={tippyOptions}>
    {@render children()}
  </g>
{:else}
  <span use:htmlConditionalAction={tippyOptions}>
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
