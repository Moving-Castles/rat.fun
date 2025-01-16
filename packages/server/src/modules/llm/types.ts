export type EventsReturnValue = {
    log: string[]
};

export type OutcomeReturnValue = {
    newTrait: string,
    statChanges: {
        health: number,
        level: number
    }
}

export type Changes = Record<string, number>;