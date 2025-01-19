export type TraitChange = {
    type: "add" | "remove",
    id?: string,
    name?: string
}

export type OutcomeReturnValue = {
    traitChanges: TraitChange[],
    newItems: string[],
    statChanges: {
        health: number,
        level: number
    }
}

export type EventsReturnValue = {
    log: string[]
};