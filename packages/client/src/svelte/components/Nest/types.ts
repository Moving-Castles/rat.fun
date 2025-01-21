export type TraitChange = {
  type: "add" | "remove",
  name: string,
  value: number,
  id?: string // Only set if type == "remove"
}

export type NewItem = {
  name: string,
  value: number
}

export type ServerReturnValue = {
    log: string[]
    traitChanges: TraitChange[]
    newItems: NewItem[]
    balanceTransfer: number
    statChanges: {
      [key: string]: number
    }
  }