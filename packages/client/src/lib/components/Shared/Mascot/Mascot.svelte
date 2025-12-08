<script lang="ts">
  import { Mascot as BaseMascot, type TerminalOutputUnit } from "@ratfun/shared-ui/Mascot"
  import { playSound } from "$lib/modules/sound"

  let {
    entranceOn = false,
    bigDanceOn = false,
    smallDanceOn = false,
    headBobOn = false,
    text = [],
    smallText = false,
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
    isGameMascot?: boolean
    closeTextOnClick?: boolean
    finishTextOnClick?: boolean
    autoHideAfter?: number
  } = $props()
</script>

<BaseMascot
  {entranceOn}
  {bigDanceOn}
  {smallDanceOn}
  {headBobOn}
  {text}
  {smallText}
  {isGameMascot}
  {closeTextOnClick}
  {finishTextOnClick}
  {autoHideAfter}
  {playSound}
/>
