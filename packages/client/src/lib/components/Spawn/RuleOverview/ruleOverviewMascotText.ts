import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const ruleOverviewMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Buy one of our organically grown rats with $RAT tokens.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Drug them up to the brim of their skull.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Send them tripping.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Fingercrossed they survive.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Retrieve any PSYCHO OBJECTS (We resell those to various military partners)",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Cash out $RAT tokens.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Repeat.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
