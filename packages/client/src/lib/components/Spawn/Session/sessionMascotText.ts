import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const sessionMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Welcome back operator!",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Retrieve your account below",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
