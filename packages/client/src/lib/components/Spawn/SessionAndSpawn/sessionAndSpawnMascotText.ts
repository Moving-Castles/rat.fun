import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"
import { getRandomMascotSoundId } from "$lib/modules/sound/sound-library/ratfun-mascot"

function onType() {
  playSound({ category: "ratfunMascot", id: getRandomMascotSoundId(), pitch: randomPitch() })
}

function onSingleType() {
  playSound({ category: "ratfunMascot", id: "mascot23", pitch: randomPitch() })
}

export const sessionAndSpawnMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "GREAT!",
    color: "var(--foreground)",
    typeMode: "char",
    typeSpeed: 40,
    backgroundColor: "transparent",
    onType: onSingleType
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
