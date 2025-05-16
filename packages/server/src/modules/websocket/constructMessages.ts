import type { Rat, Room, Player } from "@modules/types";
import { getRoomIndex } from "@modules/mud/getOnchainData";
import type { OffChainMessage, OutcomeReturnValue } from "@modules/types";
import { v4 as uuidv4 } from 'uuid';

export function createOutcomeMessage(player: Player, rat: Rat, newRatHealth: number, room: Room, validatedOutcome: OutcomeReturnValue): OffChainMessage {
    // Death
    if (newRatHealth == 0) {
        return {
            id: uuidv4(),
            topic: 'rat__death',
            playerName: player.name,
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
        playerName: player.name,
        roomId: room.id,
        roomIndex: Number(room.index),
        ratName: rat.name,
        timestamp: Date.now()
    }
}

export function createRoomCreationMessage(roomId: string, player: Player): OffChainMessage {
    const roomIndex = getRoomIndex(roomId)

    return {
        id: uuidv4(),
        topic: 'room__creation',
        message: "created a room",
        playerName: player.name,
        roomId: roomId,
        roomIndex: Number(roomIndex),
        timestamp: Date.now()
    }
}