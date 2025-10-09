import { get } from "svelte/store"
import { blockNumber } from "$lib/modules/network"

export const entriesChronologically = (a: [string, Trip], b: [string, Trip]) => {
  return Number(b[1]?.index || 0) - Number(a[1].index || 0)
}

export const entriesChronologicallyDesc = (a: [string, Trip], b: [string, Trip]) => {
  return Number(a[1]?.index || 0) - Number(b[1].index || 0)
}

export const entriesByVisit = (a: [string, Trip], b: [string, Trip]) => {
  const aVisitCount = Number(a[1]?.visitCount || 0)
  const bVisitCount = Number(b[1]?.visitCount || 0)
  return bVisitCount - aVisitCount
}

export const entriesByVisitDesc = (a: [string, Trip], b: [string, Trip]) => {
  const aVisitCount = Number(a[1]?.visitCount || 0)
  const bVisitCount = Number(b[1]?.visitCount || 0)
  return aVisitCount - bVisitCount
}

export const entriesByProfit = (a: [string, Trip], b: [string, Trip]) => {
  const aProfit = Number(a[1].balance) - Number(a[1].tripCreationCost)
  const bProfit = Number(b[1].balance) - Number(b[1].tripCreationCost)
  return bProfit - aProfit
}

export const entriesByProfitDesc = (a: [string, Trip], b: [string, Trip]) => {
  const aProfit = Number(a[1].balance) - Number(a[1].tripCreationCost)
  const bProfit = Number(b[1].balance) - Number(b[1].tripCreationCost)
  return aProfit - bProfit
}

export const entriesByRealisedProfit = (a: [string, Trip], b: [string, Trip]) => {
  const aProfit = Number(a[1].liquidationValue) - Number(a[1].tripCreationCost)
  const bProfit = Number(b[1].liquidationValue) - Number(b[1].tripCreationCost)
  return bProfit - aProfit
}

export const entriesByRealisedProfitDesc = (a: [string, Trip], b: [string, Trip]) => {
  const aProfit = Number(a[1].liquidationValue) - Number(a[1].tripCreationCost)
  const bProfit = Number(b[1].liquidationValue) - Number(b[1].tripCreationCost)
  return aProfit - bProfit
}

export const entriesByBalance = (a: [string, Trip], b: [string, Trip]) => {
  return Number(b[1].balance || 0) - Number(a[1].balance || 0)
}

export const entriesByKillCount = (a: [string, Trip], b: [string, Trip]) => {
  const aKillCount = Number(a[1]?.killCount || 0)
  const bKillCount = Number(b[1]?.killCount || 0)
  return bKillCount - aKillCount
}

export const entriesByPopularity = (a: [string, Trip], b: [string, Trip]) => {
  const currentBlock = Number(get(blockNumber))

  const aScore = computePopularity(
    Number(a[1]?.visitCount || 0),
    Number(currentBlock - (Number(a[1]?.creationBlock) || 0)),
    Number(currentBlock - (Number(a[1]?.lastVisitBlock) || 0))
  )
  const bScore = computePopularity(
    Number(b[1]?.visitCount || 0),
    Number(currentBlock - (Number(b[1]?.creationBlock) || 0)),
    Number(currentBlock - (Number(b[1]?.lastVisitBlock) || 0))
  )

  return bScore - aScore
}

/**
 * Computes a popularity score for a post based on:
 * - Number of visits
 * - Time since creation (in blocks)
 * - Time since last visit (in blocks)
 *
 * @param visits - Total number of visits to the post
 * @param blocksSinceCreation - How many blocks ago the post was created
 * @param blocksSinceLastVisit - How many blocks ago the post was last visited
 * @returns Popularity score (higher = "hotter")
 */
function computePopularity(
  visits: number,
  blocksSinceCreation: number,
  blocksSinceLastVisit: number
): number {
  // Decay constants (tunable)
  const alpha = 1.0 // Controls decay based on post age
  const beta = 1.5 // Controls decay based on last visit

  // Freshness decay: favors newer posts
  const freshnessDecay = 1 / Math.pow(blocksSinceCreation + 2, alpha)

  // Visit recency decay: favors recently visited posts
  const visitDecay = 1 / Math.pow(blocksSinceLastVisit + 2, beta)

  // Logarithmic scaling to dampen very high visit counts
  const popularityScore = Math.log(visits + 1) * freshnessDecay * visitDecay

  return popularityScore
}
