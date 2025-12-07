import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const connectWalletFormMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Gooooooood morning OPERATOR!",
    typeSpeed: 40,
    typeMode: "char",
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content:
      "Before we start we need to verify that you are connecting from one of our allied territories.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  }
]
