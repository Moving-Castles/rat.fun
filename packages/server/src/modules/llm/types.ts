export type TraitChange = {
    type: "add" | "remove",
    name: string,
    value: number,
    id?: string // Only set if type is "remove"
}

export type ItemChange = {
    type: "add" | "remove",
    name: string,
    value: number,
    id?: string // Only set if type is "remove"
}

export type OutcomeReturnValue = {
    id?: string,
    statChanges: {
        health: number
    },
    traitChanges: TraitChange[],
    itemChanges: ItemChange[],
    balanceTransfer: number
}

export type PvPOutcomeReturnValue = {
    ratA: OutcomeReturnValue,
    ratB: OutcomeReturnValue
}

export type LogEntry = {
    timestamp: string,
    event: string
}

export type EventsReturnValue = LogEntry[];

export type CorrectedEventsReturnValue = {
    logEntries: LogEntry[] 
}

export type CombinedReturnValue = {
    log: LogEntry[],
    outcome: OutcomeReturnValue,
}