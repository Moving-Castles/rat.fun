import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export function getDoneMascotText(playerName: string): TerminalOutputUnit[] {
  return [
    {
      type: "text",
      content: `${playerName}, time to grind!`,
      color: "black",
      backgroundColor: "transparent",
      onChar
    }
  ]
}
