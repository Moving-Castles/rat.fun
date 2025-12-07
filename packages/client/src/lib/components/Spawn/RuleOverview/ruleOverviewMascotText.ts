import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const ruleOverviewMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "Simple...",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "1. Buy a rat with $RAT tokens",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "2. Drug it out of its skull",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "3. Send it tripping",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "4. Fingercrossed it survive",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "5. Get PSYCHO OBJECTS",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "6. Cash out $RAT tokens",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content: "7. Repeat forever",
    typeMode: "word",
    typeSpeed: 100,
    color: "var(--foreground)",
    backgroundColor: "transparent",
    onType
  }
]
