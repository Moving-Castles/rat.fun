import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const allowanceMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "One more thing:",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content:
      "we recommend letting the Slop Machine control your spending by syncing with your amygdala and substantia nigra.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  },
  {
    type: "text",
    content:
      "This suppresses your fight or flight instincts and smoothens out your reward centers so tokens can flow faster.",
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  }
]
