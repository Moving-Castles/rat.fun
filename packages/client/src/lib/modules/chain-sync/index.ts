/**
 * Chain Sync Module
 *
 * Handles synchronization between MUD blockchain state and Svelte stores.
 * - waitForChainSync: Waits for indexer sync to complete (returns Promise)
 * - createComponentSystem: Subscribes to live component updates
 * - initEntities: Hydrates initial state and sets up subscriptions
 * - isEntitiesInitialized: Check if entities have been initialized
 * - resetEntitiesInitialization: Reset for wallet reconnection scenarios
 */

export { waitForChainSync } from "./waitForChainSync"
export { createComponentSystem } from "./createComponentSystem"
export { initEntities, isEntitiesInitialized, resetEntitiesInitialization } from "./initEntities"
export {
  hydrateFromServer,
  fetchConfig,
  fetchWorldStats,
  fetchPlayers,
  fetchTrips,
  getQueryServerUrl,
  shouldHydrateFromServer
} from "./hydrateFromServer"
export type {
  ServerHydrationResult,
  ConfigResult,
  WorldStatsResult,
  PlayersResult,
  TripsResult
} from "./hydrateFromServer"
