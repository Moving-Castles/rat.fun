import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export function getDoneMascotText(playerName: string): TerminalOutputUnit[] {
  return [
    {
      type: "text",
      content: `${playerName}...`,
      color: "var(--foreground)",

      backgroundColor: "transparent",
      onType
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
