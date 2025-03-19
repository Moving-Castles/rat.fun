import { Rat } from "@routes/room/enter/types";

export function validateInputData(playerId: string, rat: Rat) {
    // Check that sender owns the rat
    if (rat.owner !== playerId) {
        throw new Error('You are not the owner of the rat.');
    } 
    
    // Check that the rat is alive
    if (rat.dead) {
        throw new Error('The rat is dead.');
    }
}