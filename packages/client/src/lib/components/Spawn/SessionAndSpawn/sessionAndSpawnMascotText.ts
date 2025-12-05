import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const sessionAndSpawnMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Great!",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content:
      "Great! Now if you just sign here, you should be able to receive your slop machine pass.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Enter your chosen operator ID below.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
