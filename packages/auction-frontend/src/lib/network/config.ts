/**
 * Network configuration for auction-frontend
 *
 * Base mainnet only.
 */

import { PUBLIC_BASE_RPC_URL } from "$env/static/public"
import {
  BasicNetworkConfig,
  ENVIRONMENT,
  getBasicNetworkConfig
} from "@ratfun/common/basic-network"

export interface NetworkConfig extends BasicNetworkConfig {}

/**
 * Get network configuration (Base mainnet only)
 */
export function getNetworkConfig(): NetworkConfig {
  const overrideDefaultRpcUrls = {
    http: [PUBLIC_BASE_RPC_URL]
  }

  const config = getBasicNetworkConfig(ENVIRONMENT.BASE, overrideDefaultRpcUrls)

  return {
    ...config
  }
}
