export type TraitChange = {
    type: "add" | "remove",
    id: string,
    name: string,
    value: number,
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