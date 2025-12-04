import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export type PendingMascotMessage =
  | { type: "new_player" }
  | { type: "first_death" }
  | { type: "death_trip" }
  | { type: "death_cashout" }
  | { type: "bigwin"; payout: number }
  | { type: "first_cashout" }
  | { type: "admin_unlock" }
  | { type: "test" }

export type MascotMessageData = {
  text: TerminalOutputUnit[]
}
