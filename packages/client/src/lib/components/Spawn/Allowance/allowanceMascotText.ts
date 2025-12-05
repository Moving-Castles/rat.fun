import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const allowanceMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content:
      "One last thing: we recommend letting the slop machine control your spending by syncing your amygdala and substantia nigra to it.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content:
      "This suppresses your fight or flight instincts and smoothens out your reward centers so tokens can flow faster.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
