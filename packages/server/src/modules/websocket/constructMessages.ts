import type { Rat, Room } from "@routes/room/enter/types";
import type { OffChainMessage } from "@modules/websocket/types";
import type { OutcomeReturnValue } from "@modules/llm/types";
import type { ClientComponents } from "@modules/mud/createClientComponents";
import { getPlayerName } from "@modules/mud/getOnchainData";

export function createOutcomeMessage(rat: Rat, newRatHealth: number, room: Room, validatedOutcome: OutcomeReturnValue): OffChainMessage {
    // Death
    if (newRatHealth == 0) {
        return {
            topic: 'rat__death',
            message: `${rat.name} died in room #${room.index}`,
            timestamp: Date.now()
        }
    }

    // Outcome
    const addedItems = (validatedOutcome?.itemChanges ?? []).filter(item => item.type ==  "add").map(item => { return `${item.name} ($${item.value})` }).join(', ')
    const removedItems = (validatedOutcome?.itemChanges ?? []).filter(item => item.type ==  "remove").map(item => { return `${item.name} ($${item.value})` }).join(', ')

    const addedTraits = (validatedOutcome?.traitChanges ?? []).filter(trait => trait.type ==  "add").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')
    const removedTraits = (validatedOutcome?.traitChanges ?? []).filter(trait => trait.type ==  "remove").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')

    let message = `${rat.name}`

    let hasMessage = false

    if((validatedOutcome?.healthChange?.amount ?? 0) !== 0) {
        message += ` Health change: ${validatedOutcome?.healthChange?.amount}`
        hasMessage = true
    }

    if((validatedOutcome?.balanceTransfer?.amount ?? 0) !== 0) {
        message += `Balance change: ${validatedOutcome?.balanceTransfer?.amount}`
        hasMessage = true
    }

    if (addedItems.length > 0) {
        message += ` got ${addedItems}`
        hasMessage = true
    }

    if (removedItems.length > 0) {
        message += ` lost ${removedItems}`
        hasMessage = true
    }

    if (addedTraits.length > 0) {
        message += ` got ${addedTraits}`
        hasMessage = true
    }

    if (removedTraits.length > 0) {
        message += ` lost ${removedTraits}`
        hasMessage = true
    }

    if (!hasMessage) {
        message += ": no change"
    }

    return {
        topic: 'room__outcome',
        message,
        timestamp: Date.now()
    }
}

export function createRoomCreationMessage(playerId: string, Name: ClientComponents['Name']): OffChainMessage {
    const playerName = getPlayerName(playerId, Name)
    return {
        topic: 'room__creation',
        message: `${playerName} created a room`,
        timestamp: Date.now()
    }
}