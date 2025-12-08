import {
  terminalTyper as baseTerminalTyper,
  type TerminalOutputUnit
} from "@ratfun/shared-ui/terminal-typer"
import { playSound } from "$lib/modules/sound"

export function terminalTyper(targetElement: HTMLElement, units: TerminalOutputUnit[]) {
  return baseTerminalTyper(targetElement, units, playSound)
}
