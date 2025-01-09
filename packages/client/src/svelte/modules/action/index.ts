import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  CreateBrain = NAMESPACE + "createBrain"
}

// --- API --------------------------------------------------------------

export function createBrain(traitA: number, traitB: number, traitC: number, traitD: number) {
  return addToSequencer(WorldFunctions.CreateBrain, [traitA, traitB, traitC, traitD])
}