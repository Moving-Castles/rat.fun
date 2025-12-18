import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"
import { getRandomMascotSoundId } from "$lib/modules/sound/sound-library/ratfun-mascot"

function onType() {
  playSound({ category: "ratfunMascot", id: getRandomMascotSoundId(), pitch: randomPitch() })
}

function onSingleType() {
  playSound({ category: "ratfunMascot", id: "mascot23", pitch: randomPitch() })
}

export const introductionMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Ah, operator!",
    color: "var(--foreground)",
    typeMode: "char",
    typeSpeed: 40,
    backgroundColor: "transparent",
    onType: onSingleType
  },
  {
    type: "text",
    content: "I see you're playing the Slop Machine from the Walled State of Kowloon.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "One of our most profitable locations.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content:
      "The CEO of RAT.FUN Psychic Instruments LLC came up with this elaborate economic scheme on one of his most heroic trips.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "In the absence of a labour market this is your best chance at upward mobility...",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  }
]
