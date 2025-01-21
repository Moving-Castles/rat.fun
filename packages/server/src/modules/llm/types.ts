export type TraitChange = {
    type: "add" | "remove",
    name: string,
    value: number,
    id?: string // Only set if type is "remove"
}

export type Item = {
    name: string,
    value: number,
}

export type OutcomeReturnValue = {
    traitChanges: TraitChange[],
    newItems: Item[],
    balanceTransfer: number,
    statChanges: {
        health: number,
        level: number
    }
}

export type EventsReturnValue = {
    log: string[]
};