import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const ruleOverviewMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Before we proceed, let me explain the rules.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Rule 1: ...",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Rule 2: ...",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
