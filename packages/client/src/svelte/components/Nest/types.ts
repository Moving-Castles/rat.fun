export type ServerReturnValue = {
    log: string[]
    newTrait: string
    statChanges: {
      [key: string]: number
    }
  }