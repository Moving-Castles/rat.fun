<script lang="ts">
  import { BaseSlideToggle, type SlideToggleOption } from "@ratfun/shared-ui/SlideToggle"
  import { playSound } from "$lib/modules/sound"

  let {
    options,
    value,
    onchange,
    disabled = false,
    height,
    secondary = false,
    compact = false
  }: {
    options: SlideToggleOption[]
    value: string
    onchange: (value: string) => void
    disabled?: boolean
    height?: number
    secondary?: boolean
    compact?: boolean
  } = $props()

  function handleSelect() {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
  }
</script>

<BaseSlideToggle
  {options}
  {value}
  {onchange}
  {disabled}
  {height}
  {secondary}
  onSelect={handleSelect}
/>
