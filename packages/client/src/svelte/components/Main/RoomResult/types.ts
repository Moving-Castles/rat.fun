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

export type HealthChange = {
  logStep: number,
  amount: number
}

export type BalanceTransfer = {
  logStep: number,
  amount: number
}

export type LogEntry = {
  timestamp: string,
  event: string
}

export type ServerReturnValue = {
  id: Hex,
  log: LogEntry[]
  healthChange: HealthChange
  traitChanges: TraitChange[]
  itemChanges: ItemChange[]
  balanceTransfer: BalanceTransfer
}

export type TempItem = {
  name: string,
  value: number
}  

  export type FrozenRat = Rat & {
    inventory: Array<string | TempItem>
    traits: Array<string | TempItem>
  }

  export type FrozenRoom = Room & {
    id: Hex
  }