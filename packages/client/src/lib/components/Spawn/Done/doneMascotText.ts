import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"
import { getRandomMascotSoundId } from "$lib/modules/sound/sound-library/ratfun-mascot"

function onType() {
  playSound({ category: "ratfunMascot", id: getRandomMascotSoundId(), pitch: randomPitch() })
}

function onSingleType() {
  playSound({ category: "ratfunMascot", id: "mascot23", pitch: randomPitch() })
}

export function getDoneMascotText(playerName: string): TerminalOutputUnit[] {
  return [
    {
      type: "text",
      content: `${playerName}...`,
      typeMode: "char",
      typeSpeed: 40,
      color: "var(--foreground)",
      backgroundColor: "transparent",
      onType: onSingleType
    },
    {
      type: "text",
      content: "time to grind!",
      color: "var(--foreground)",
      typeMode: "word",
      typeSpeed: 100,
      backgroundColor: "transparent",
      onType
    }
  ]
}
