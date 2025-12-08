import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export type PendingMascotMessage =
  | { type: "new_player" }
  | { type: "first_death"; deadRatName?: string }
  | { type: "death_trip"; deadRatCount?: number; deadRatName?: string }
  | { type: "death_cashout" }
  | { type: "bigwin"; payout: number }
  | { type: "first_cashout" }
  | { type: "admin_unlock" }
  | { type: "test" }

export type MascotMessageData = {
  text: TerminalOutputUnit[]
}
