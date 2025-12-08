<script lang="ts">
  import { Mascot as BaseMascot, type TerminalOutputUnit } from "@ratfun/shared-ui/Mascot"
  import { playSound as playSoundRaw } from "$lib/modules/sound"

  let {
    entranceOn = false,
    bigDanceOn = false,
    smallDanceOn = false,
    headBobOn = false,
    text = [],
    smallText = false,
    hugeText = false,
    isGameMascot = false,
    closeTextOnClick = false,
    finishTextOnClick = false,
    autoHideAfter = 0
  }: {
    entranceOn?: boolean
    bigDanceOn?: boolean
    smallDanceOn?: boolean
    headBobOn?: boolean
    text?: TerminalOutputUnit[]
    smallText?: boolean
    hugeText?: boolean
    isGameMascot?: boolean
    closeTextOnClick?: boolean
    finishTextOnClick?: boolean
    autoHideAfter?: number
  } = $props()

  // Adapt positional playSound to object signature
  const playSound = (config: { category: string; id: string }) => {
    playSoundRaw(config.category, config.id)
  }
</script>

<BaseMascot
  {entranceOn}
  {bigDanceOn}
  {smallDanceOn}
  {headBobOn}
  {text}
  {smallText}
  {hugeText}
  {isGameMascot}
  {closeTextOnClick}
  {finishTextOnClick}
  {autoHideAfter}
  {playSound}
/>
