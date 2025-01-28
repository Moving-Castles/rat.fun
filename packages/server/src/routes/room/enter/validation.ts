import { OutcomeReturnValue } from "@modules/llm/types";
import { Rat, Room } from "./types";

export function validateOnchainData(playerId: string, rat: Rat, room: Room) {
    // Check that sender owns the rat
    if (rat.owner !== playerId) {
        throw new Error('You are not the owner of the rat.');
    } 
    
    // Check that the rat is alive
    if (rat.dead) {
        throw new Error('The rat is dead.');
    }

    // Check that room balance is positive
    if (room.balance <= 0) {
        throw new Error('The room balance is not positive.');
    }
}

export async function validateOutcome(outcome: OutcomeReturnValue, rat: Rat, room: Room): Promise<OutcomeReturnValue> {
    if(!outcome) {
        throw new Error('Outcome llm call failed')
    }

    console.log('outcome', outcome)

    const validatedOutcome = outcome
    let roomBalanceBudget = room.balance

    console.log('initial roomBalanceBudget', roomBalanceBudget)

    // * * * * * * * * * * * * *
    // HEALTH
    // * * * * * * * * * * * * *

    // Rat is dead
    if(rat.stats.health + validatedOutcome.statChanges.health <= 0) {
        // Health change value can not cause rat's health to go below 0
        validatedOutcome.statChanges.health = -rat.stats.health
        // As rat died, exit early and ignore changes to traits, items and balance
        validatedOutcome.traitChanges = []
        validatedOutcome.itemChanges = []
        validatedOutcome.balanceTransfer = 0
        console.log('Rat is dead', validatedOutcome)
        return validatedOutcome
    }

    // Room can not give more health than it has balance
    if(validatedOutcome.statChanges.health > room.balance) {
        validatedOutcome.statChanges.health = room.balance
    }

    // Update room balance budget 
    roomBalanceBudget -= validatedOutcome.statChanges.health

    console.log('After health: roomBalanceBudget', roomBalanceBudget)

    // * * * * * * * * * * * * *
    // TRAITS
    // * * * * * * * * * * * * *

    const traitsToRemove = validatedOutcome.traitChanges.filter(traitChange => traitChange.type === 'remove')
    const traitsToAdd = validatedOutcome.traitChanges.filter(traitChange => traitChange.type === 'add')

    // Start with removing traits from rat
    for(let i = 0; i < traitsToRemove.length; i++) {
        if(traitsToRemove[i].value > 0) {
            // Removing a positive trait from rat adds value to room balance
            if(roomBalanceBudget + traitsToRemove[i].value < 0) {
                // Room balance can not go below 0
                traitsToRemove[i].value = roomBalanceBudget
                roomBalanceBudget = 0
            } else {
                roomBalanceBudget += traitsToRemove[i]?.value ?? 0
            }
        } else {
            // Removing a negative trait from rat remove value to room balance
            roomBalanceBudget -= traitsToRemove[i]?.value ?? 0
        }
    }

    // Then add traits to rat
    for(let i = 0; i < traitsToAdd.length; i++) {
        if(traitsToAdd[i].value > 0) {
            // Adding a positive trait to rat removes value from room balance
            if(roomBalanceBudget - traitsToAdd[i].value < 0) {
                // Room balance can not go below 0
                traitsToAdd[i].value = roomBalanceBudget
                roomBalanceBudget = 0
            } else {
                roomBalanceBudget -= traitsToAdd[i]?.value ?? 0
            }
        } else {
            // Adding a negative trait to rat adds value to room balance
            roomBalanceBudget += traitsToAdd[i]?.value ?? 0
        }
    }

    console.log('After traits: roomBalanceBudget', roomBalanceBudget)

    // * * * * * * * * * * * * *
    // ITEMS
    // * * * * * * * * * * * * *

    const itemsToRemove = validatedOutcome.itemChanges.filter(itemChange => itemChange.type === 'remove')
    const itemsToAdd = validatedOutcome.itemChanges.filter(itemChange => itemChange.type === 'add')

    // Start with removing items from rat
    for(let i = 0; i < itemsToRemove.length; i++) {
        if(itemsToRemove[i].value > 0) {
            // Removing a positive item from rat adds value to room balance
            roomBalanceBudget += itemsToRemove[i]?.value ?? 0
        } else {
            // Removing a negative item from rat remove value to room balance
            if(roomBalanceBudget + itemsToRemove[i].value < 0) {
                // Room balance can not go below 0
                itemsToRemove[i].value = roomBalanceBudget
                roomBalanceBudget = 0
            } else {
                roomBalanceBudget -= itemsToRemove[i]?.value ?? 0
            }
        }
    }

    // Then add items to rat
    for(let i = 0; i < itemsToAdd.length; i++) {
        if(itemsToAdd[i].value > 0) {
            // Adding a positive item to rat removes value from room balance
            if(roomBalanceBudget - itemsToAdd[i].value < 0) {
                // Room balance can not go below 0
                itemsToAdd[i].value = roomBalanceBudget
                roomBalanceBudget = 0
            } else {
                roomBalanceBudget -= itemsToAdd[i]?.value ?? 0
            }
        } else {
            // Adding a negative item to rat adds value to room balance
            roomBalanceBudget += itemsToAdd[i]?.value ?? 0
        }
    }

    console.log('After items: roomBalanceBudget', roomBalanceBudget)

    // * * * * * * * * * * * * *
    // BALANCE
    // * * * * * * * * * * * * *

    console.log('rat.balance', rat.balance)
    console.log('validatedOutcome.balanceTransfer', validatedOutcome.balanceTransfer)

    // Negative balance transfer can not be more than rat's balance
    if(rat.balance + validatedOutcome.balanceTransfer < 0) {
        console.log("Negative balance transfer can not be more than rat's balance");
        validatedOutcome.balanceTransfer = rat.balance
    }
    
    // Positive balance transfer can not be more than room balance
    if(validatedOutcome.balanceTransfer > roomBalanceBudget) {
        console.log("Positive balance transfer can not be more than room balance")
        validatedOutcome.balanceTransfer = roomBalanceBudget < 0 ? 0 : roomBalanceBudget
    }

    roomBalanceBudget -= validatedOutcome.balanceTransfer 

    console.log('After balance transfer: roomBalanceBudget', roomBalanceBudget)

    // - - - - - - - -

    console.log('validatedOutcome', validatedOutcome)

    return validatedOutcome
}