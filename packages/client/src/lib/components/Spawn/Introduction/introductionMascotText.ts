import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const introductionMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content:
      "Ah, operator! I see you’re playing this Slop Machine from our facility inside the Walled State of Kowloon, Hong Kong. One of our finest locations.",
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content:
      "The CEO of RAT.FUN Psychic Instruments LLC came up with this elaborate economic scheme on one of his most heroic trips. In the absence of a labour market this is your best chance at upward mobility. ",
    color: "black",
    backgroundColor: "transparent",
    onChar
  }
]
