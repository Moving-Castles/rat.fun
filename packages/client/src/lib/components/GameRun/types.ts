import { Hex } from "viem"
import { LogEntry, BalanceTransfer, ItemChange } from "@server/modules/types"

export type TempItem = {
  name: string
  value: number
}

export type FrozenRat = Rat & {
  inventory: Array<string | TempItem>
  image: string
  initialBalance: number
  initialTotalValue: number
}

export type FrozenTrip = Trip & {
  id: Hex
}

export type MergedLogEntry = LogEntry & {
  balanceTransfer?: BalanceTransfer
  itemChanges?: ItemChange[]
}

export type OutcomeDataStringMap = {
  type: string
  action: string
  value: string
  name?: string
  id?: string
}

// Type for registered outcome elements
export type RegisteredOutcome = {
  node: HTMLElement
  data: DOMStringMap | LogEntryFields
}

export type LogEntryFields = {
  id?: string
  name: string
  value: number
  action: string
  type: string
}
