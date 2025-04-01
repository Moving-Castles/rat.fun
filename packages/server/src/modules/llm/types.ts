/**
 * Changes
 */

export type TraitChange = {
    logStep: number, // The step in the log where the change occurred
    type: "add" | "remove",
    name: string,
    value: number,
    id?: string // Only set if type is "remove"
}

export type ItemChange = {
    logStep: number, // The step in the log where the change occurred
    type: "add" | "remove",
    name: string,
    value: number,
    id?: string // Only set if type is "remove"
}

export type BalanceTransfer = {
    logStep: number, // The step in the log where the change occurred
    from: string,
    to: string,
    amount: number
}

export type HealthChange = {
    logStep: number, // The step in the log where the change occurred
    amount: number
}

export type OutcomeReturnValue = {
    id?: string,
    traitChanges: TraitChange[],
    itemChanges: ItemChange[],
    healthChange: HealthChange,
    balanceTransfer: BalanceTransfer
}

/**
 * Log entry
 */

export type LogEntry = {
    timestamp: string,
    event: string,
}

/**
 * Return value
 */

export type EventsReturnValue = {
    log: LogEntry[],
    outcome: OutcomeReturnValue
}

export type CorrectionReturnValue = {
    log: LogEntry[]
}