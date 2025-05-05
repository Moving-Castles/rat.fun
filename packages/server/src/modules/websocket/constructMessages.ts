import type { Rat, Room } from "@routes/room/enter/types";
import type { OffChainMessage } from "@modules/websocket/types";
import type { OutcomeReturnValue } from "@modules/llm/types";
import type { ClientComponents } from "@modules/mud/createClientComponents";
import { getPlayerName, getRoomIndex } from "@modules/mud/getOnchainData";
import { v4 as uuidv4 } from 'uuid';

export function createOutcomeMessage(playerId: string, Name: ClientComponents['Name'], rat: Rat, newRatHealth: number, room: Room, validatedOutcome: OutcomeReturnValue): OffChainMessage {
    const playerName = getPlayerName(playerId, Name)

    // Death
    if (newRatHealth == 0) {
        return {
            id: uuidv4(),
            topic: 'rat__death',
            playerName: playerName,
            ratName: rat.name,
            roomId: room.id,
            roomIndex: Number(room.index),
            message: `died in room #${room.index}`,
            timestamp: Date.now()
        }
    }


    // Outcome
    const addedItems = (validatedOutcome?.itemChanges ?? []).filter(item => item.type ==  "add").map(item => { return `${item.name} ($${item.value})` }).join(', ')
    const removedItems = (validatedOutcome?.itemChanges ?? []).filter(item => item.type ==  "remove").map(item => { return `${item.name} ($${item.value})` }).join(', ')

    const addedTraits = (validatedOutcome?.traitChanges ?? []).filter(trait => trait.type ==  "add").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')
    const removedTraits = (validatedOutcome?.traitChanges ?? []).filter(trait => trait.type ==  "remove").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')

    let message = "Result: "

    let hasMessage = false

    if((validatedOutcome?.healthChange?.amount ?? 0) !== 0) {
        message += ` (Health change: ${validatedOutcome?.healthChange?.amount})`
        hasMessage = true
    }

    if((validatedOutcome?.balanceTransfer?.amount ?? 0) !== 0) {
        message += ` (Balance change: ${validatedOutcome?.balanceTransfer?.amount})`
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
        message += " no change"
    }

    return {
        id: uuidv4(),
        topic: 'room__outcome',
        message,
        playerName: playerName,
        roomId: room.id,
        roomIndex: Number(room.index),
        ratName: rat.name,
        timestamp: Date.now()
    }
}

export function createRoomCreationMessage(roomId: string, playerId: string, Name: ClientComponents['Name'], Index: ClientComponents['Index']): OffChainMessage {
    const playerName = getPlayerName(playerId, Name)
    const roomIndex = getRoomIndex(roomId, Index)

    return {
        id: uuidv4(),
        topic: 'room__creation',
        message: "created a room",
        playerName: playerName,
        roomId: roomId,
        roomIndex: Number(roomIndex),
        timestamp: Date.now()
    }
}