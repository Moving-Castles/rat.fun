import { defineWorld } from "@latticexyz/world"
import { ENTITY_TYPE_ARRAY } from "./enums"

export default defineWorld({
  namespace: "ratfun",
  enums: {
    ENTITY_TYPE: ENTITY_TYPE_ARRAY
  },
  codegen: {
    generateSystemLibraries: true
  },
  deploy: {
    upgradeableWorldImplementation: true
  },
  tables: {
    GameConfig: {
      key: [],
      schema: {
        adminAddress: "address",
        adminId: "bytes32",
        ratCreationCost: "uint256",
        maxInventorySize: "uint32",
        maxTripPromptLength: "uint32",
        cooldownCloseTrip: "uint32",
        ratsKilledForAdminAccess: "uint32"
      },
      codegen: {
        dataStruct: true
      }
    },
    GamePercentagesConfig: {
      key: [],
      schema: {
        maxValuePerWin: "uint32", // Limits how much a rat can extract from trip in one run
        minRatValueToEnter: "uint32", // Minimum total value of rat to enter trip.
        taxationLiquidateRat: "uint32",
        taxationCloseTrip: "uint32"
      }
    },
    WorldStats: {
      key: [],
      schema: {
        globalTripIndex: "uint256",
        globalRatIndex: "uint256",
        globalRatKillCount: "uint256",
        lastKilledRatBlock: "uint256"
      }
    },
    ExternalAddressesConfig: {
      key: [],
      schema: {
        erc20Address: "address",
        gamePoolAddress: "address",
        mainSaleAddress: "address",
        serviceAddress: "address",
        usdcAddress: "address"
      },
      codegen: {
        dataStruct: true
      }
    },
    WorldEvent: {
      key: [],
      schema: {
        creationBlock: "uint256",
        expirationBlock: "uint256",
        cmsId: "string",
        title: "string",
        prompt: "string"
      }
    },
    // = = = = = = = = = =
    Name: "string", // Set on player, rat and trip
    EntityType: "ENTITY_TYPE",
    CreationBlock: "uint256", // Set on player, rat and trip
    LastVisitBlock: "uint256", // Set on trip
    // = = = = = = = = = =
    Balance: "uint256", // Amount of credits. Set on player, rat and trip.
    // = = = = = = = = = =
    Dead: "bool", // Set on rat
    Liquidated: "bool", // Set on rat and trip when it is liquidated by owner
    LiquidationValue: "uint256", // Set on rat and trip when it is liquidated, gross value (before taxation)
    LiquidationTaxPercentage: "uint256", // Set on rat and trip when it is liquidated
    LiquidationBlock: "uint256", // Set on rat and trip when it is liquidated
    // = = = = = = = = = =
    Inventory: "bytes32[]", // Items carried by player and rat
    // = = = = = = = = = =
    MasterKey: "bool", // Set on player. Gives access to in-game admin area.
    Index: "uint256", // Set on rat and trip
    Value: "uint256", // Set on items
    CurrentRat: "bytes32", // Set on player
    PastRats: "bytes32[]", // Set on player. List of rats the player has owned.
    Owner: "bytes32", // Set on trip and rat
    VisitCount: "uint256", // Set on trip
    KillCount: "uint256", // Set on trip
    TripCount: "uint256", // Set on rat
    // = = = = = = = = = =
    Prompt: "string",
    // = = = = = = = = = =
    TripCreationCost: "uint256" // Initial balance of trip.
  },
  systems: {
    // DevSystem is conditionally deployed for local/test chains in PostDeploy
    DevSystem: {
      deploy: {
        disabled: true
      }
    }
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: []
    }
  ]
})
