import { Hex } from "viem"

export type TraitChange = {
  logStep: number,
  type: "add" | "remove",
  name: string,
  value: number,
  id?: string // Is only set if type == "remove"
}

export type ItemChange = {
  logStep: number,
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
  healthChange: {
    logStep: number,
    amount: number
  }
  traitChanges: TraitChange[]
  itemChanges: ItemChange[]
  balanceTransfer: {
    logStep: number,
    amount: number
  }
}