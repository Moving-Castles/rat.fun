<script lang="ts">
  import { SmallButton as BaseSmallButton } from "@ratfun/shared-ui/Buttons"
  import { playSound } from "$lib/modules/sound"
  import { isPhone } from "$lib/modules/ui/state.svelte"

  let {
    text,
    cost,
    tippyText,
    disabled = false,
    extraClass = "",
    onmouseup,
    onclick
  }: {
    text: string
    cost?: number
    tippyText?: string
    disabled?: boolean
    extraClass?: string
    onmouseup?: (e: MouseEvent) => void
    onclick?: (e: MouseEvent) => void
  } = $props()

  const handleMousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const handleMouseup = (e: MouseEvent) => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
    onmouseup?.(e)
  }
</script>

<BaseSmallButton
  {text}
  {cost}
  {tippyText}
  {disabled}
  {extraClass}
  isPhone={$isPhone}
  onmousedown={handleMousedown}
  onmouseup={handleMouseup}
  {onclick}
/>
