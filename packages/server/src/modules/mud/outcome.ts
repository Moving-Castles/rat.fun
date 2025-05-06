import { OutcomeReturnValue, TraitChange, ItemChange } from "@modules/llm/types"
import { Rat, Room,} from "@routes/room/enter/types"

export function createOutcomeCallArgs(rat: Rat, room: Room, outcome: OutcomeReturnValue) {
    const healthChange = outcome?.healthChange?.amount ?? 0;
    const balanceTransfer = outcome?.balanceTransfer?.amount ?? 0;

    // Only ID
    const traitsToRemoveFromRat = outcome?.traitChanges.filter(c => c.type === "remove").map(c => c.id) ?? [];
    
    // TRAIT struct
    const traitsToAddToRat = outcome?.traitChanges.filter(c => c.type === "add").map(c => {
      return { name: c.name, value: c.value }
    }) ?? [];

    // Only ID
    const itemsToRemoveFromRat = outcome?.itemChanges.filter(c => c.type === "remove").map(c => c.id) ?? [];
    
    // ITEM struct
    const itemsToAddToRat = outcome?.itemChanges.filter(c => c.type === "add").map(c => {
      return { name: c.name, value: c.value }
    }) ?? [];
  
    return [
      rat.id,
      room.id, 
      healthChange,
      balanceTransfer,
      traitsToRemoveFromRat,
      traitsToAddToRat,
      itemsToRemoveFromRat,
      itemsToAddToRat
    ]
}

export function updateOutcome(
  oldOutcome: OutcomeReturnValue,
  oldRat: Rat,
  newRat: Rat
): OutcomeReturnValue {
    // Deep clone the old outcome
    const newOutcome = JSON.parse(JSON.stringify(oldOutcome))

    // console.log('old outcome:', oldOutcome);
    // console.log('old rat:', oldRat);
    // console.log('new rat:', newRat);

    // - - - - - - - - -
    // ID
    // - - - - - - - - -

    newOutcome.id = newRat.id

    // - - - - - - - - -
    // HEALTH
    // - - - - - - - - -
    
    // Guard against undefined healthChange
    if (!newOutcome.healthChange) {
      newOutcome.healthChange = {
        amount: 0,
        logStep: 0
      }
    }

    newOutcome.healthChange.amount = newRat.stats.health - oldRat.stats.health

    // - - - - - - - - -
    // TRAITS
    // - - - - - - - - -


    newOutcome.traitChanges = []

    // Iterate over traits in new rat and compare with old rat
    for (let i = 0; i < newRat.traits.length; i++) {
        // If trait is not in old rat, it was added
        if (!oldRat.traits.find(trait => trait.id === newRat.traits[i].id)) {
            // Get logStep for new trait
            const logStep = getLogStep(newRat.traits[i].name, oldOutcome.traitChanges)
            newOutcome.traitChanges.push({
                logStep,
                type: "add",
                name: newRat.traits[i].name,
                value: newRat.traits[i].value,
                id: newRat.traits[i].id,
            })
        }
    }

    // Iterate over traits in old rat and compare with new rat
    for (let i = 0; i < oldRat.traits.length; i++) {
        // If trait is not in new rat, it was removed
        if (!newRat.traits.find(trait => trait.id === oldRat.traits[i].id)) {
            // Get logStep removed trait
            const logStep = getLogStep(oldRat.traits[i].name, oldOutcome.traitChanges)
            newOutcome.traitChanges.push({
                logStep,
                type: "remove",
                name: oldRat.traits[i].name,
                value: oldRat.traits[i].value,
                id: oldRat.traits[i].id,
            })
        }
    }

    // - - - - - - - - -
    // ITEMS
    // - - - - - - - - -

    newOutcome.itemChanges = []

    // Iterate over items in new rat and compare with old rat
    for (let i = 0; i < newRat.inventory.length; i++) {
        // If item is not in old rat, it was added
        if (!oldRat.inventory.find(item => item.id === newRat.inventory[i].id)) {
            // Get logStep for new item
            const logStep = getLogStep(newRat.inventory[i].name, oldOutcome.itemChanges)
            newOutcome.itemChanges.push({
                logStep,
                type: "add",
                name: newRat.inventory[i].name,
                value: newRat.inventory[i].value,
                id: newRat.inventory[i].id,
            })
        }
    }

    // Iterate over items in old rat and compare with new rat
    for (let i = 0; i < oldRat.inventory.length; i++) {
        // If item is not in new rat, it was removed
        if (!newRat.inventory.find(item => item.id === oldRat.inventory[i].id)) {
            // Get logStep for removed item
            const logStep = getLogStep(oldRat.inventory[i].name, oldOutcome.itemChanges)
            newOutcome.itemChanges.push({
                logStep,
                type: "remove",
                name: oldRat.inventory[i].name,
                value: oldRat.inventory[i].value,
                id: oldRat.inventory[i].id,
            })
        }
    }

    // - - - - - - - - -
    // BALANCE
    // - - - - - - - - -

    // Guard against undefined balanceTransfer
    if (!newOutcome.balanceTransfer) {
      newOutcome.balanceTransfer = {
        amount: 0,
        logStep: 0
      }
    }
    
    newOutcome.balanceTransfer.amount = newRat.balance - oldRat.balance

    return newOutcome
}

function getLogStep(name: string, list: TraitChange[] | ItemChange[]) {
    const item = list.find(i => i.name === name)
    return item?.logStep ?? 0
}