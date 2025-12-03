import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export type PendingMascotMessage =
  | { type: "death"; deathCount: number }
  | { type: "bigwin"; payout: number }
  | { type: "first_cashout" }
  | { type: "admin_unlock" }
  | { type: "test" }

export type MascotMessageData = {
  text: TerminalOutputUnit[]
}
