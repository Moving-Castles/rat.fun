import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"
import {
  getQualifiedTableName as t,
  getTableValue,
  getArrayValue,
  byteaToHex,
  formatBalance,
  getLastSyncedBlockNumber,
  ENTITY_TYPE
} from "../utils.js"
import { PlayerResponse, ChallengeResponse, ChallengeWinnerEntry } from "../types.js"

// Fetch full player info
async function fetchPlayerInfo(playerId: string): Promise<PlayerResponse | null> {
  const [name, currentRatBuffer, pastRats, creationBlock, masterKey] = await Promise.all([
    getTableValue<string>("Name", playerId),
    getTableValue<Buffer>("CurrentRat", playerId),
    getArrayValue("PastRats", playerId),
    getTableValue<string>("CreationBlock", playerId),
    getTableValue<boolean>("MasterKey", playerId)
  ])

  // Check if player exists
  if (!name && !creationBlock) {
    return null
  }

  return {
    id: playerId,
    name,
    currentRat: byteaToHex(currentRatBuffer),
    pastRats,
    creationBlock,
    masterKey: masterKey ?? false
  }
}

// Fetch challenge trip data
async function fetchChallengeTrip(tripId: string): Promise<ChallengeResponse | null> {
  const [
    ownerBuffer,
    index,
    balance,
    prompt,
    visitCount,
    killCount,
    creationBlock,
    lastVisitBlock,
    tripCreationCost,
    liquidated,
    liquidationValue,
    liquidationBlock,
    fixedMinValueToEnter,
    overrideMaxValuePerWinPercentage,
    challengeWinnerBuffer
  ] = await Promise.all([
    getTableValue<Buffer>("Owner", tripId),
    getTableValue<string>("Index", tripId),
    getTableValue<string>("Balance", tripId),
    getTableValue<string>("Prompt", tripId),
    getTableValue<string>("VisitCount", tripId),
    getTableValue<string>("KillCount", tripId),
    getTableValue<string>("CreationBlock", tripId),
    getTableValue<string>("LastVisitBlock", tripId),
    getTableValue<string>("TripCreationCost", tripId),
    getTableValue<boolean>("Liquidated", tripId),
    getTableValue<string>("LiquidationValue", tripId),
    getTableValue<string>("LiquidationBlock", tripId),
    getTableValue<string>("FixedMinValueToEnter", tripId),
    getTableValue<string>("OverrideMaxValuePerWinPercentage", tripId),
    getTableValue<Buffer>("ChallengeWinner", tripId)
  ])

  const ownerId = byteaToHex(ownerBuffer)
  const challengeWinnerId = byteaToHex(challengeWinnerBuffer)

  // Get owner name
  let ownerName: string | null = null
  if (ownerId) {
    ownerName = await getTableValue<string>("Name", ownerId)
  }

  // Fetch winner player info if there's a winner
  let winner: PlayerResponse | null = null
  if (challengeWinnerId) {
    winner = await fetchPlayerInfo(challengeWinnerId)
  }

  return {
    id: tripId,
    owner: ownerId,
    ownerName,
    index,
    balance: formatBalance(balance),
    prompt,
    visitCount: visitCount ?? "0",
    killCount: killCount ?? "0",
    creationBlock,
    lastVisitBlock,
    tripCreationCost: formatBalance(tripCreationCost),
    liquidated: liquidated ?? false,
    liquidationValue: formatBalance(liquidationValue),
    liquidationBlock,
    fixedMinValueToEnter: formatBalance(fixedMinValueToEnter),
    overrideMaxValuePerWinPercentage: overrideMaxValuePerWinPercentage ?? null,
    challengeWinner: challengeWinnerId,
    winner
  }
}

const challenges: FastifyPluginAsync = async fastify => {
  // GET /api/active-challenge - Get currently active challenge trip (balance > 0)
  fastify.get("/api/active-challenge", async (_request, reply) => {
    const sql = `
      SELECT et.id
      FROM ${t("EntityType")} et
      INNER JOIN ${t("ChallengeTrip")} ct ON ct.id = et.id AND ct.value = true
      LEFT JOIN ${t("Balance")} b ON b.id = et.id
      WHERE et.value = $1
        AND b.value IS NOT NULL
        AND CAST(b.value AS NUMERIC) > 0
      LIMIT 1
    `

    try {
      const result = await query<{ id: Buffer }>(sql, [ENTITY_TYPE.TRIP])

      if (result.rows.length === 0) {
        return reply.send({
          active: false,
          challenge: null
        })
      }

      const tripId = byteaToHex(result.rows[0].id)!
      const challenge = await fetchChallengeTrip(tripId)

      return reply.send({
        active: true,
        challenge
      })
    } catch (error) {
      console.error("Error fetching active challenge:", error)
      return reply.status(500).send({ error: "Failed to fetch active challenge" })
    }
  })

  // GET /api/challenges - Get all challenge trips with winner player expanded
  fastify.get("/api/challenges", async (_request, reply) => {
    const sql = `
      SELECT et.id
      FROM ${t("EntityType")} et
      INNER JOIN ${t("ChallengeTrip")} ct ON ct.id = et.id AND ct.value = true
      LEFT JOIN ${t("CreationBlock")} cb ON cb.id = et.id
      WHERE et.value = $1
      ORDER BY CAST(COALESCE(cb.value, '0') AS NUMERIC) DESC
    `

    try {
      const result = await query<{ id: Buffer }>(sql, [ENTITY_TYPE.TRIP])

      const [challenges, blockNumber] = await Promise.all([
        Promise.all(
          result.rows.map(async row => {
            const tripId = byteaToHex(row.id)!
            return fetchChallengeTrip(tripId)
          })
        ),
        getLastSyncedBlockNumber()
      ])

      return reply.send({
        blockNumber,
        count: challenges.length,
        challenges: challenges.filter(c => c !== null)
      })
    } catch (error) {
      console.error("Error fetching challenges:", error)
      return reply.status(500).send({ error: "Failed to fetch challenges" })
    }
  })

  // GET /api/leaderboard/challenge-winners - Get players who have won at least one challenge
  // ChallengeWinner stores the player ID directly
  fastify.get("/api/leaderboard/challenge-winners", async (_request, reply) => {
    // Find all challenge trips that have a winner (player ID)
    const sql = `
      SELECT cw.value as player_id, et.id as trip_id
      FROM ${t("EntityType")} et
      INNER JOIN ${t("ChallengeTrip")} ct ON ct.id = et.id AND ct.value = true
      INNER JOIN ${t("ChallengeWinner")} cw ON cw.id = et.id
      WHERE et.value = $1
        AND cw.value IS NOT NULL
    `

    try {
      const result = await query<{ player_id: Buffer; trip_id: Buffer }>(sql, [ENTITY_TYPE.TRIP])

      // Group by player
      const playerWinsMap = new Map<string, string[]>()
      for (const row of result.rows) {
        const playerId = byteaToHex(row.player_id)!
        const tripId = byteaToHex(row.trip_id)!

        if (!playerWinsMap.has(playerId)) {
          playerWinsMap.set(playerId, [])
        }
        playerWinsMap.get(playerId)!.push(tripId)
      }

      // Fetch full data for each player
      const entries: ChallengeWinnerEntry[] = await Promise.all(
        Array.from(playerWinsMap.entries()).map(async ([playerId, tripIds]) => {
          const player = await fetchPlayerInfo(playerId)
          const challenges = await Promise.all(tripIds.map(id => fetchChallengeTrip(id)))

          return {
            player: player!,
            challengesWon: tripIds.length,
            challenges: challenges.filter(c => c !== null) as ChallengeResponse[]
          }
        })
      )

      // Filter out entries where player doesn't exist and sort by challenges won
      const validEntries = entries
        .filter(e => e.player !== null)
        .sort((a, b) => b.challengesWon - a.challengesWon)

      const blockNumber = await getLastSyncedBlockNumber()

      return reply.send({
        blockNumber,
        count: validEntries.length,
        entries: validEntries
      })
    } catch (error) {
      console.error("Error fetching challenge winners:", error)
      return reply.status(500).send({ error: "Failed to fetch challenge winners" })
    }
  })
}

export default challenges
