import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const sessionAndSpawnMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "GREAT!",
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "Now if you just sign here, you will get your Slop Machine pass.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "Enter your chosen operator ID below.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  }
]
