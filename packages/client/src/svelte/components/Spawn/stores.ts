import { writable, derived } from "svelte/store";

export const MAX_ENERGY = 400;
export const TRAIT_MAX = 200;

// export const TRAIT_LABELS = ['Trait A', 'Trait B', 'Trait C', 'Trait D'];
export const TRAIT_LABELS = ['MEDULLA', 'CERBERUS', 'DEATH DRIVE', 'PINEAL GLAND'];

export const energyAllocation = writable([100,100,100,100]);

export const remainingEnergy = derived(
    energyAllocation,
    $allocation =>
      MAX_ENERGY - Object.values($allocation).reduce((acc, val) => acc + val, 0)
  )