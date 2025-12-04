import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const introductionMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content:
      "Oh I see you are connecting from our facility within the Walled State of Kowloon, Hong Kong.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "One of our finest locations.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "You are operating our new Remote Viewing Slop Machine",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Your job is simple OPERATOR:",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
