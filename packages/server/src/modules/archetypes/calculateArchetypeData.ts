import type { OutcomeReturnValue } from "@modules/types"

export function calculateArchetypeData(outcome: OutcomeReturnValue, newRatValue: number) {
  console.log(
    "the new rat value is: ",
    newRatValue,
    "and translates to kills amount: ",
    newRatValue == 0 ? 1 : 0
  )
  return {
    archetypeItemAdd: outcome.itemChanges.reduce((a, b) => {
      if (b.type == "add") return a + Number(b.value)
      return a
    }, 0),
    archetypeItemRemove: outcome.itemChanges.reduce((a, b) => {
      if (b.type == "remove") return a + Number(b.value)
      return a
    }, 0),
    archetypeBalanceAdd: outcome.balanceTransfers.reduce((a, b) => {
      if (b.amount >= 0) return a + Number(b.amount)
      return a
    }, 0),
    archetypeBalanceRemove: outcome.balanceTransfers.reduce((a, b) => {
      if (b.amount < 0) return a + Math.abs(Number(b.amount))
      return a
    }, 0),
    kills: newRatValue == 0 ? 1 : 0,
    visits: 1
  }
}
