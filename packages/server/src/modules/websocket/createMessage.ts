import { Rat, Room } from "@routes/room/enter/types";
import { OutcomeReturnValue } from "@modules/llm/types";

export function createMessage(rat: Rat, room: Room, validatedOutcome: OutcomeReturnValue) {
    const topic = 'room__outcome'

    const addedItems = validatedOutcome.itemChanges.filter(item => item.type ==  "add").map(item => { return `${item.name} (${item.value})` }).join(', ')
    const removedItems = validatedOutcome.itemChanges.filter(item => item.type ==  "remove").map(item => { return `${item.name} (${item.value})` }).join(', ')

    const addedTraits = validatedOutcome.traitChanges.filter(trait => trait.type ==  "add").map(trait => { return `${trait.name} (${trait.value})` }).join(', ')
    const removedTraits = validatedOutcome.traitChanges.filter(trait => trait.type ==  "remove").map(trait => { return `${trait.name} (${trait.value})` }).join(', ')

    let message = `${rat.name}`

    if (addedItems.length > 0) {
        message += ` got ${addedItems}`
    }

    if (removedItems.length > 0) {
        message += ` lost ${removedItems}`
    }

    if (addedTraits.length > 0) {
        message += ` got ${addedTraits}`
    }

    if (removedTraits.length > 0) {
        message += ` lost ${removedTraits}`
    }

    console.log(message)

    return {
        topic,
        message
    }
}