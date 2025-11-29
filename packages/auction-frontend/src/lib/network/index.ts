/**
 * Network module for auction-frontend
 *
 * Re-exports all network functionality.
 */

export { ENVIRONMENT, getEnvironmentFromUrl, getNetworkConfig, type NetworkConfig } from "./config"
export {
  environment,
  networkConfig,
  publicClient,
  worldAddress,
  externalAddresses,
  networkReady,
  loadingMessage,
  type ExternalAddresses
} from "./stores"
export { initNetwork, getPublicClient, getExternalAddresses } from "./init"
