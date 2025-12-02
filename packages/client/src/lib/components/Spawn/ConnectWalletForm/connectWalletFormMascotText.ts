import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onChar() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

export const connectWalletFormMascotText: TerminalOutputUnit[] = [
  {
    type: "text",
    content: "good morning operator",
    typeSpeed: 30,
    color: "black",
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "Welcome to xxxxx a remote viewing slop machine",
    color: "black",
    typeSpeed: 30,
    backgroundColor: "transparent",
    onChar
  },
  {
    type: "text",
    content: "connect wallet to prove operator identity",
    color: "black",
    typeSpeed: 30,
    backgroundColor: "transparent",
    onChar
  }
]
