import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"
import { getRandomMascotSoundId } from "$lib/modules/sound/sound-library/ratfun-mascot"

function onType() {
  playSound({ category: "ratfunMascot", id: getRandomMascotSoundId(), pitch: randomPitch() })
}

function onSingleType() {
  playSound({ category: "ratfunMascot", id: "mascot23", pitch: randomPitch() })
}

export const connectWalletFormMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Gooooooood morning OPERATOR!",
    typeSpeed: 40,
    typeMode: "char",
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType: onSingleType
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
