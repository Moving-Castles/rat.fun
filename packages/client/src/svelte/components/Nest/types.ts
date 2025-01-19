export type TraitChange = {
  type: "add" | "remove",
  id?: string,
  name?: string
}

export type ServerReturnValue = {
    log: string[]
    traitChanges: TraitChange[]
    newItems: string[]
    statChanges: {
      [key: string]: number
    }
  }