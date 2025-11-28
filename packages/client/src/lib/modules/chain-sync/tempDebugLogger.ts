/**
 * Temporary Debug Logger for Chain Sync
 *
 * Provides metrics on initial hydration and live update sync load.
 * Remove this file once filtering optimization is complete.
 */

type ComponentStats = {
  entityCount: number
  totalValues: number // For structs, counts all field values
}

type HydrationStats = {
  // Before filtering (what we read from indexer)
  indexer: {
    totalEntities: number
    totalComponentValues: number
    estimatedSizeBytes: number
    componentBreakdown: Record<string, ComponentStats>
  }
  // After filtering (what we keep in store)
  filtered: {
    totalEntities: number
    estimatedSizeBytes: number
    filteredOutCount: number
    partialSyncCount: number
  }
  timestamp: number
}

type LiveUpdateStats = {
  componentKey: string
  entityId: string
  operation: "set" | "delete"
  skipped: boolean // True if skipped due to deepEqual
  timestamp: number
  valueSizeBytes: number
}

// Stores live update history for analysis
const liveUpdateLog: LiveUpdateStats[] = []
let hydrationStats: HydrationStats | null = null

// Rough byte size estimation for values
function estimateByteSize(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "boolean") return 4
  if (typeof value === "number") return 8
  if (typeof value === "bigint") return 8
  if (typeof value === "string") return value.length * 2
  if (typeof value === "object") {
    return Object.values(value).reduce((acc: number, v) => acc + estimateByteSize(v), 0)
  }
  return 0
}

export type FilteringStats = {
  filteredOutCount: number
  partialSyncCount: number
}

/**
 * Log stats for initial hydration from indexer.
 * Shows both pre-filtering (from indexer) and post-filtering (in store) stats.
 */
export function logHydrationStats(
  preFilterEntities: Entities,
  postFilterEntities: Entities,
  componentBreakdown: Record<string, ComponentStats>,
  filteringStats: FilteringStats
) {
  // Pre-filter stats (what we read from indexer)
  const preFilterCount = Object.keys(preFilterEntities).length
  let preFilterComponentValues = 0
  let preFilterSizeBytes = 0

  for (const stats of Object.values(componentBreakdown)) {
    preFilterComponentValues += stats.totalValues
  }
  for (const entity of Object.values(preFilterEntities)) {
    preFilterSizeBytes += estimateByteSize(entity)
  }

  // Post-filter stats (what we keep in store)
  const postFilterCount = Object.keys(postFilterEntities).length
  let postFilterSizeBytes = 0
  for (const entity of Object.values(postFilterEntities)) {
    postFilterSizeBytes += estimateByteSize(entity)
  }

  hydrationStats = {
    indexer: {
      totalEntities: preFilterCount,
      totalComponentValues: preFilterComponentValues,
      estimatedSizeBytes: preFilterSizeBytes,
      componentBreakdown
    },
    filtered: {
      totalEntities: postFilterCount,
      estimatedSizeBytes: postFilterSizeBytes,
      filteredOutCount: filteringStats.filteredOutCount,
      partialSyncCount: filteringStats.partialSyncCount
    },
    timestamp: Date.now()
  }

  // Calculate reduction percentages
  const entityReduction =
    preFilterCount > 0 ? ((1 - postFilterCount / preFilterCount) * 100).toFixed(1) : "0"
  const sizeReduction =
    preFilterSizeBytes > 0 ? ((1 - postFilterSizeBytes / preFilterSizeBytes) * 100).toFixed(1) : "0"

  console.group("🔄 [Chain Sync] Hydration Stats")

  console.log("📥 From Indexer:")
  console.log(`   Entities: ${preFilterCount}`)
  console.log(`   Component values: ${preFilterComponentValues}`)
  console.log(`   Size: ${(preFilterSizeBytes / 1024).toFixed(2)} KB`)

  console.log("")
  console.log("📦 After Filtering:")
  console.log(`   Entities: ${postFilterCount} (-${entityReduction}%)`)
  console.log(`   Size: ${(postFilterSizeBytes / 1024).toFixed(2)} KB (-${sizeReduction}%)`)
  console.log(`   Filtered out: ${filteringStats.filteredOutCount} entities`)
  console.log(`   Partial sync: ${filteringStats.partialSyncCount} entities`)

  console.log("")
  console.log("Component breakdown (from indexer):")
  const sortedComponents = Object.entries(componentBreakdown).sort(
    (a, b) => b[1].entityCount - a[1].entityCount
  )
  for (const [key, stats] of sortedComponents) {
    console.log(`   ${key}: ${stats.entityCount} entities, ${stats.totalValues} values`)
  }
  console.groupEnd()
}

/**
 * Track a component being processed during hydration
 */
export function trackComponentHydration(
  componentKey: string,
  entityCount: number,
  totalValues: number
): ComponentStats {
  return { entityCount, totalValues }
}

/**
 * Log a live update event
 */
export function logLiveUpdate(
  componentKey: string,
  entityId: string,
  operation: "set" | "delete",
  skipped: boolean,
  value?: unknown
) {
  const stats: LiveUpdateStats = {
    componentKey,
    entityId,
    operation,
    skipped,
    timestamp: Date.now(),
    valueSizeBytes: value ? estimateByteSize(value) : 0
  }

  liveUpdateLog.push(stats)

  // Keep log bounded to last 1000 entries
  if (liveUpdateLog.length > 1000) {
    liveUpdateLog.shift()
  }

  // Log individual updates (can be noisy, adjust as needed)
  const prefix = skipped ? "⏭️" : operation === "set" ? "✅" : "🗑️"
  console.log(
    `${prefix} [Live Update] ${componentKey} | ${entityId.slice(0, 10)}... | ${operation}${skipped ? " (skipped)" : ""}`
  )
}

/**
 * Print summary of live updates since last call or since start
 */
export function printLiveUpdateSummary(sinceLast = false) {
  const cutoff = sinceLast && liveUpdateLog.length > 0 ? liveUpdateLog[0].timestamp : 0

  const relevantLogs = liveUpdateLog.filter(l => l.timestamp > cutoff)

  if (relevantLogs.length === 0) {
    console.log("📊 [Live Update Summary] No updates recorded")
    return
  }

  const byComponent: Record<string, { applied: number; skipped: number; bytes: number }> = {}

  for (const log of relevantLogs) {
    if (!byComponent[log.componentKey]) {
      byComponent[log.componentKey] = { applied: 0, skipped: 0, bytes: 0 }
    }
    if (log.skipped) {
      byComponent[log.componentKey].skipped++
    } else {
      byComponent[log.componentKey].applied++
      byComponent[log.componentKey].bytes += log.valueSizeBytes
    }
  }

  const totalApplied = relevantLogs.filter(l => !l.skipped).length
  const totalSkipped = relevantLogs.filter(l => l.skipped).length
  const totalBytes = relevantLogs.reduce((acc, l) => acc + l.valueSizeBytes, 0)

  console.group("📊 [Live Update Summary]")
  console.log(
    `Total updates: ${relevantLogs.length} (${totalApplied} applied, ${totalSkipped} skipped)`
  )
  console.log(`Total data: ${(totalBytes / 1024).toFixed(2)} KB`)
  console.log("")
  console.log("By component:")
  const sortedComponents = Object.entries(byComponent).sort((a, b) => b[1].applied - a[1].applied)
  for (const [key, stats] of sortedComponents) {
    console.log(
      `  ${key}: ${stats.applied} applied, ${stats.skipped} skipped, ${(stats.bytes / 1024).toFixed(2)} KB`
    )
  }
  console.groupEnd()
}

/**
 * Get raw stats for programmatic access
 */
export function getDebugStats() {
  return {
    hydration: hydrationStats,
    liveUpdates: [...liveUpdateLog],
    liveUpdateCount: liveUpdateLog.length
  }
}

// Expose to window for console access
if (typeof window !== "undefined") {
  ;(window as any).__chainSyncDebug = {
    getStats: getDebugStats,
    printSummary: printLiveUpdateSummary,
    hydration: () => hydrationStats,
    liveUpdates: () => liveUpdateLog
  }
}
