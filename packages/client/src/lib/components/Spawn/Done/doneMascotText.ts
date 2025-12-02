import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export function getDoneMascotText(playerName: string): TerminalOutputUnit[] {
  return [
    {
      type: "text",
      content: `${playerName}, you are set!`,
      color: "black",
      backgroundColor: "transparent"
    }
  ]
}
