import { Hex } from "viem"

export type TraitChange = {
  type: "add" | "remove",
  name: string,
  value: number,
  id?: string // Is only set if type == "remove"
}

export type ItemChange = {
  type: "add" | "remove",
  name: string,
  value: number,
  id?: string // Is only set if type == "remove"
}

export type LogEntry = {
  timestamp: string,
  event: string
}

export type ServerReturnValue = {
  id: Hex,
  log: LogEntry[]
  statChanges: {
    [key: string]: number
  }
  traitChanges: TraitChange[]
  itemChanges: ItemChange[]
  balanceTransfer: number
}