import { Hex } from "viem"
import { LogEntry, BalanceTransfer, TraitChange, ItemChange } from "@server/modules/types"

export type TempItem = {
  name: string
  value: number
}

export type FrozenRat = Rat & {
  inventory: Array<string | TempItem>
  traits: Array<string | TempItem>
  image: string
}

export type FrozenRoom = Room & {
  id: Hex
}

export type MergedLogEntry = LogEntry & {
  balanceTransfer?: BalanceTransfer
  traitChanges?: TraitChange[]
  itemChanges?: ItemChange[]
}

export type OutcomeDataStringMap = {
  type: string
  action: string
  value: string
  name?: string
  id?: string
}
