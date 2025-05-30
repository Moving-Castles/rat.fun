// (c) Manus Spreithof
// Input 1: store value
// Input 2: condition
// Input 3: condition dependencies
// Output: state value, updated with live store value once the condition is rendered true.
import { get } from "svelte/store"

export const gates = $state({})

export const initGated = (
  name: string,
  store,
  condition,
  conditionDependencies
) => {
  gates[name] = $derived.by(() => {})
}
