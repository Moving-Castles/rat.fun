import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const allowanceMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content:
      "Before we start we need to sync your amygdala and substantia nigra to our slop machine.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content:
      "This suppresses your flight or fight instincts and smoothens out your reward centre so tokens can flow faster.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "in and out of each other’s bodies",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
