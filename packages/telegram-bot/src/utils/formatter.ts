import type { PlayerResponse, RatResponse, TripResponse, ItemResponse } from "../services/query-server.js"

/**
 * Format player status for Telegram display
 */
export function formatPlayerStatus(player: PlayerResponse): string {
  const lines: string[] = [
    "PLAYER STATUS",
    "━━━━━━━━━━━━━━━━━━━",
    `Name: ${player.name || "Unknown"}`,
  ]

  if (player.masterKey) {
    lines.push("Admin: Yes")
  }

  return lines.join("\n")
}

/**
 * Format rat status for Telegram display
 */
export function formatRatStatus(rat: RatResponse, items: ItemResponse[]): string {
  const balance = parseInt(rat.balance || "0", 10)
  const totalValue = parseInt(rat.totalValue || "0", 10)
  const inventoryValue = totalValue - balance

  const lines: string[] = [
    "RAT STATUS",
    "━━━━━━━━━━━━━━━━━━━",
    `Name: ${rat.name || "Unknown"}`,
    `Balance: ${balance} tokens`,
  ]

  // Add inventory
  if (rat.inventory && rat.inventory.length > 0) {
    lines.push(`Inventory: ${rat.inventory.length}/6 items`)
    for (const item of rat.inventory) {
      const itemValue = item.value ? parseInt(item.value, 10) : 0
      lines.push(`  • ${item.name || "Unknown"} (${itemValue})`)
    }
  } else {
    lines.push("Inventory: Empty")
  }

  lines.push("")
  lines.push(`Total Value: ${totalValue} tokens`)

  // Add health bar visualization
  const maxHealth = 100
  const healthPercent = Math.min(100, Math.max(0, (balance / maxHealth) * 100))
  const filledBlocks = Math.round(healthPercent / 10)
  const emptyBlocks = 10 - filledBlocks
  const healthBar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks)
  lines.push(`Health: ${healthBar} ${Math.round(healthPercent)}%`)

  return lines.join("\n")
}

/**
 * Format trip for Telegram display
 */
export function formatTrip(trip: TripResponse): string {
  const balance = parseInt(trip.balance || "0", 10)
  const minEntry = parseInt(trip.tripCreationCost || "0", 10) * 0.1 // 10% of creation cost
  const visits = parseInt(trip.visitCount || "0", 10)
  const kills = parseInt(trip.killCount || "0", 10)

  const lines: string[] = [
    `Balance: ${balance} | Min: ${Math.round(minEntry)}`,
    `Visits: ${visits} | Kills: ${kills}`,
  ]

  if (trip.challengeTrip) {
    lines.unshift("🏆 CHALLENGE")
  }

  return lines.join("\n")
}

/**
 * Format trip list for Telegram display
 */
export function formatTripList(trips: TripResponse[], page: number, perPage: number = 5): string {
  const start = (page - 1) * perPage
  const pageTrips = trips.slice(start, start + perPage)
  const totalPages = Math.ceil(trips.length / perPage)

  const lines: string[] = [
    "AVAILABLE TRIPS",
    "━━━━━━━━━━━━━━━━━━━",
    ""
  ]

  if (pageTrips.length === 0) {
    lines.push("No trips available.")
    return lines.join("\n")
  }

  for (let i = 0; i < pageTrips.length; i++) {
    const trip = pageTrips[i]
    const num = start + i + 1
    const balance = parseInt(trip.balance || "0", 10)
    const minEntry = parseInt(trip.tripCreationCost || "0", 10) * 0.1
    const visits = parseInt(trip.visitCount || "0", 10)
    const kills = parseInt(trip.killCount || "0", 10)

    lines.push(`${num}. ${trip.prompt?.slice(0, 30) || "Unnamed trip"}...`)
    lines.push(`   Balance: ${balance} | Min: ${Math.round(minEntry)}`)
    lines.push(`   Visits: ${visits} | Kills: ${kills}`)

    if (trip.challengeTrip) {
      lines.push("   🏆 Challenge Trip")
    }

    lines.push("")
  }

  lines.push(`Page ${page}/${totalPages}`)

  return lines.join("\n")
}

/**
 * Format trip details for Telegram display
 */
export function formatTripDetails(trip: TripResponse): string {
  const balance = parseInt(trip.balance || "0", 10)
  const minEntry = parseInt(trip.tripCreationCost || "0", 10) * 0.1
  const visits = parseInt(trip.visitCount || "0", 10)
  const kills = parseInt(trip.killCount || "0", 10)
  const creationCost = parseInt(trip.tripCreationCost || "0", 10)

  const lines: string[] = [
    "TRIP DETAILS",
    "━━━━━━━━━━━━━━━━━━━",
    ""
  ]

  if (trip.prompt) {
    lines.push(trip.prompt)
    lines.push("")
  }

  lines.push("━━━━━━━━━━━━━━━━━━━")
  lines.push(`Balance: ${balance} tokens`)
  lines.push(`Min Entry: ${Math.round(minEntry)} tokens`)
  lines.push(`Creation Cost: ${creationCost} tokens`)
  lines.push(`Visits: ${visits}`)
  lines.push(`Kills: ${kills}`)

  if (trip.challengeTrip) {
    lines.push("")
    lines.push("🏆 This is a Challenge Trip")
    if (trip.fixedMinValueToEnter) {
      lines.push(`Fixed Min Entry: ${trip.fixedMinValueToEnter}`)
    }
  }

  return lines.join("\n")
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

/**
 * Format a wallet address for display
 */
export function formatAddress(address: string): string {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
