import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const sessionMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "session setup time",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "sign once to play fast",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "no more annoying popups",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
