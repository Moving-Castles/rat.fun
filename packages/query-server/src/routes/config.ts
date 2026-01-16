import { FastifyPluginAsync } from "fastify"
import { getSingletonTableRow, formatBalance, getLastSyncedBlockNumber } from "../utils.js"
import type {
  GlobalConfigsResponse,
  GameConfigResponse,
  GamePercentagesConfigResponse,
  ExternalAddressesConfigResponse,
  ItemNftConfigResponse,
  ChallengeConfigResponse
} from "../types.js"

// Raw DB row types (columns are snake_case)
// Note: MUD stores uint256 as numeric strings, uint32 as integers, addresses as bytea
type GameConfigRow = {
  admin_address: Buffer | null
  admin_id: Buffer | null
  rat_creation_cost: string | null
  max_inventory_size: number | null
  max_trip_prompt_length: number | null
  cooldown_close_trip: number | null
  rats_killed_for_admin_access: number | null
}

type GamePercentagesRow = {
  max_value_per_win: number | null
  min_rat_value_to_enter: number | null
  taxation_liquidate_rat: number | null
  taxation_close_trip: number | null
}

type ExternalAddressesRow = {
  erc20_address: Buffer | null
  game_pool_address: Buffer | null
  main_sale_address: Buffer | null
  service_address: Buffer | null
  fee_address: Buffer | null
}

type ItemNftConfigRow = {
  item_nft_address: Buffer | null
}

type ChallengeConfigRow = {
  min_creation_cost: string | null
  active_period_blocks: number | null
}

// Fetch all global configs (singleton tables)
// Note: Some table names are truncated in the MUD indexer database
// WorldStats is fetched separately via /api/world-stats (not cached)
async function fetchGlobalConfigs(): Promise<Omit<GlobalConfigsResponse, "blockNumber">> {
  const [
    gameConfigRow,
    gamePercentagesRow,
    externalAddressesRow,
    itemNftConfigRow,
    challengeConfigRow
  ] = await Promise.all([
    getSingletonTableRow<GameConfigRow>("GameConfig"),
    // Truncated table name: game_percentages_c instead of game_percentages_config
    getSingletonTableRow<GamePercentagesRow>("GamePercentagesC", "game_percentages_c"),
    // Truncated table name: external_addresse instead of external_addresses_config
    getSingletonTableRow<ExternalAddressesRow>("ExternalAddresse", "external_addresse"),
    getSingletonTableRow<ItemNftConfigRow>("ItemNftConfig"),
    getSingletonTableRow<ChallengeConfigRow>("ChallengeConfig")
  ])

  // Debug logging
  console.log("[config] GameConfig row:", gameConfigRow)
  console.log("[config] GamePercentagesConfig row:", gamePercentagesRow)
  console.log("[config] ExternalAddressesConfig row:", externalAddressesRow)
  console.log("[config] ItemNftConfig row:", itemNftConfigRow)
  console.log("[config] ChallengeConfig row:", challengeConfigRow)

  // Transform to response format (camelCase, hex addresses)
  const gameConfig: GameConfigResponse = {
    adminAddress: gameConfigRow?.admin_address
      ? "0x" + gameConfigRow.admin_address.toString("hex")
      : null,
    adminId: gameConfigRow?.admin_id ? "0x" + gameConfigRow.admin_id.toString("hex") : null,
    ratCreationCost: gameConfigRow?.rat_creation_cost
      ? formatBalance(gameConfigRow.rat_creation_cost)
      : null,
    maxInventorySize: gameConfigRow?.max_inventory_size ?? null,
    maxTripPromptLength: gameConfigRow?.max_trip_prompt_length ?? null,
    cooldownCloseTrip: gameConfigRow?.cooldown_close_trip ?? null,
    ratsKilledForAdminAccess: gameConfigRow?.rats_killed_for_admin_access ?? null
  }

  const gamePercentagesConfig: GamePercentagesConfigResponse = {
    maxValuePerWin: gamePercentagesRow?.max_value_per_win ?? null,
    minRatValueToEnter: gamePercentagesRow?.min_rat_value_to_enter ?? null,
    taxationLiquidateRat: gamePercentagesRow?.taxation_liquidate_rat ?? null,
    taxationCloseTrip: gamePercentagesRow?.taxation_close_trip ?? null
  }

  const externalAddressesConfig: ExternalAddressesConfigResponse = {
    erc20Address: externalAddressesRow?.erc20_address
      ? "0x" + externalAddressesRow.erc20_address.toString("hex")
      : null,
    gamePoolAddress: externalAddressesRow?.game_pool_address
      ? "0x" + externalAddressesRow.game_pool_address.toString("hex")
      : null,
    mainSaleAddress: externalAddressesRow?.main_sale_address
      ? "0x" + externalAddressesRow.main_sale_address.toString("hex")
      : null,
    serviceAddress: externalAddressesRow?.service_address
      ? "0x" + externalAddressesRow.service_address.toString("hex")
      : null,
    feeAddress: externalAddressesRow?.fee_address
      ? "0x" + externalAddressesRow.fee_address.toString("hex")
      : null
  }

  const itemNftConfig: ItemNftConfigResponse = {
    itemNftAddress: itemNftConfigRow?.item_nft_address
      ? "0x" + itemNftConfigRow.item_nft_address.toString("hex")
      : null
  }

  const challengeConfig: ChallengeConfigResponse = {
    minCreationCost: challengeConfigRow?.min_creation_cost
      ? formatBalance(challengeConfigRow.min_creation_cost)
      : null,
    activePeriodBlocks: challengeConfigRow?.active_period_blocks ?? null
  }

  return {
    gameConfig,
    gamePercentagesConfig,
    externalAddressesConfig,
    itemNftConfig,
    challengeConfig
  }
}

const config: FastifyPluginAsync = async fastify => {
  fastify.get("/api/config", async (_request, reply) => {
    const [globalConfigs, blockNumber] = await Promise.all([
      fetchGlobalConfigs(),
      getLastSyncedBlockNumber()
    ])
    // Cache for 1 hour - config values rarely change
    return reply
      .header("Cache-Control", "public, max-age=3600")
      .send({ blockNumber, ...globalConfigs })
  })
}

export default config
