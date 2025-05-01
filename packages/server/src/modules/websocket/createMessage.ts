import { Rat, Room } from "@routes/room/enter/types";
import { OutcomeReturnValue } from "@modules/llm/types";

export function createMessage(rat: Rat, newRatHealth: number, room: Room, validatedOutcome: OutcomeReturnValue) {
    // Death
    if (newRatHealth == 0) {
        return {
            topic: 'rat__death',
            message: `${rat.name} died in room #${room.index}`
        }
    }

    // Outcome
    const addedItems = validatedOutcome.itemChanges.filter(item => item.type ==  "add").map(item => { return `${item.name} ($${item.value})` }).join(', ')
    const removedItems = validatedOutcome.itemChanges.filter(item => item.type ==  "remove").map(item => { return `${item.name} ($${item.value})` }).join(', ')

    const addedTraits = validatedOutcome.traitChanges.filter(trait => trait.type ==  "add").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')
    const removedTraits = validatedOutcome.traitChanges.filter(trait => trait.type ==  "remove").map(trait => { return `${trait.name} ($${trait.value})` }).join(', ')

    let message = `${rat.name}`

    let hasMessage = false

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
        message
    }
}