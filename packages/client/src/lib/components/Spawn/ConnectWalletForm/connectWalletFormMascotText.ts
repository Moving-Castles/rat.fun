import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const connectWalletFormMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Gooooooood morning OPERATOR!",
    typeSpeed: 30,
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content:
      "Before we start we need to verify that you are connecting from one of our allied territories.",
    color: "black",
    typeSpeed: 30,
    backgroundColor: "transparent",
    onChar
  }
]
