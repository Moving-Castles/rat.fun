import { LogEntry, HealthChange,  BalanceTransfer, TraitChange, ItemChange } from "@server/modules/types"

export type MergedLogEntry = LogEntry & {
  healthChange?: HealthChange
  balanceTransfer?: BalanceTransfer
  traitChanges?: TraitChange[]
  itemChanges?: ItemChange[]
}