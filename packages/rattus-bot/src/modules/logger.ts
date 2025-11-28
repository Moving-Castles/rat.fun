// Simple console logger with colors

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
}

export function logInfo(message: string) {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`)
}

export function logSuccess(message: string) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`)
}

export function logWarning(message: string) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`)
}

export function logError(message: string) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`)
}

export function logTrip(tripNumber: number, message: string) {
  console.log(`${colors.magenta}[TRIP ${tripNumber}]${colors.reset} ${message}`)
}

export function logRat(ratName: string, message: string) {
  console.log(`${colors.blue}[RAT: ${ratName}]${colors.reset} ${message}`)
}

export function logDeath(ratName: string, tripCount: number) {
  console.log(`${colors.red}${colors.bright}`)
  console.log(`==========================================`)
  console.log(`  RAT "${ratName}" HAS DIED`)
  console.log(`  Survived ${tripCount} trips`)
  console.log(`==========================================`)
  console.log(`${colors.reset}`)
}

export function logStats(stats: {
  ratName: string
  totalTrips: number
  startingBalance: number
  finalBalance: number
}) {
  const profitLoss = stats.finalBalance - stats.startingBalance
  const profitLossColor = profitLoss >= 0 ? colors.green : colors.red

  console.log(`${colors.bright}`)
  console.log(`==========================================`)
  console.log(`  RUN STATISTICS`)
  console.log(`==========================================`)
  console.log(`${colors.reset}`)
  console.log(`  Rat Name:        ${stats.ratName}`)
  console.log(`  Total Trips:     ${stats.totalTrips}`)
  console.log(`  Starting Balance: ${stats.startingBalance}`)
  console.log(`  Final Balance:    ${stats.finalBalance}`)
  console.log(
    `  ${profitLossColor}Profit/Loss:     ${profitLoss >= 0 ? "+" : ""}${profitLoss}${colors.reset}`
  )
  console.log(``)
}

export function logSessionStats(stats: {
  totalRats: number
  totalTrips: number
  totalProfitLoss: number
}) {
  const profitLossColor = stats.totalProfitLoss >= 0 ? colors.green : colors.red

  console.log(`${colors.bright}${colors.cyan}`)
  console.log(`==========================================`)
  console.log(`  SESSION STATISTICS`)
  console.log(`==========================================`)
  console.log(`${colors.reset}`)
  console.log(`  Total Rats:      ${stats.totalRats}`)
  console.log(`  Total Trips:     ${stats.totalTrips}`)
  console.log(
    `  ${profitLossColor}Total P/L:       ${stats.totalProfitLoss >= 0 ? "+" : ""}${stats.totalProfitLoss}${colors.reset}`
  )
  console.log(``)
}

export function logValueBar(options: {
  currentValue: number
  liquidateBelowValue?: number
  liquidateAtValue?: number
}) {
  const { currentValue, liquidateBelowValue, liquidateAtValue } = options

  // If neither threshold is set, don't show the bar
  if (liquidateBelowValue === undefined && liquidateAtValue === undefined) {
    return
  }

  const barWidth = 40
  const minValue = liquidateBelowValue ?? 0
  const maxValue = liquidateAtValue ?? currentValue * 1.5

  // Calculate position (0 to 1)
  const range = maxValue - minValue
  const position = range > 0 ? Math.max(0, Math.min(1, (currentValue - minValue) / range)) : 0.5
  const filledWidth = Math.round(position * barWidth)

  // Build the bar
  const filledPart = "█".repeat(filledWidth)
  const emptyPart = "░".repeat(barWidth - filledWidth)

  // Color based on position
  let barColor: string
  if (position < 0.2) {
    barColor = colors.red
  } else if (position < 0.4) {
    barColor = colors.yellow
  } else if (position > 0.9) {
    barColor = colors.green
  } else {
    barColor = colors.cyan
  }

  // Build labels
  const leftLabel = liquidateBelowValue !== undefined ? `${liquidateBelowValue}` : "0"
  const rightLabel = liquidateAtValue !== undefined ? `${liquidateAtValue}` : "∞"

  console.log(
    `${colors.dim}[VALUE]${colors.reset} ${leftLabel} ${barColor}${filledPart}${colors.dim}${emptyPart}${colors.reset} ${rightLabel} (${currentValue})`
  )
}
