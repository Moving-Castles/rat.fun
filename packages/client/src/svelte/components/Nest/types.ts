export type ServerReturnValue = {
    eventLog: string[]
    success: boolean
    newTrait: string
    statChanges: {
      [key: string]: number
    }
  }