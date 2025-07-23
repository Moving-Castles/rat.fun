import { defineWorld } from "@latticexyz/world"
import { ENTITY_TYPE_ARRAY } from "./enums"

export default defineWorld({
  namespace: "ratfun",
  enums: {
    ENTITY_TYPE: ENTITY_TYPE_ARRAY
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
        roomCreationCost: "uint256",
        maxInventorySize: "uint32",
        maxTraitsSize: "uint32",
        maxRoomPromptLength: "uint32",
        cooldownCloseRoom: "uint32",
        taxationSellItem: "uint32",
        taxationLiquidateRat: "uint32",
        taxationCloseRoom: "uint32"
      },
      codegen: {
        dataStruct: true
      }
    },
    WorldStats: {
      key: [],
      schema: {
        globalRoomIndex: "uint256",
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
    LevelList: {
      key: [],
      schema: {
        value: "bytes32[]"
      }
    },
    WorldEvent: {
      key: [],
      schema: {
        creationBlock: "uint256",
        expirationBlock: "uint256",
        title: "string",
        prompt: "string"
      }
    },
    // ...
    Name: "string", // Set on player, rat and room
    EntityType: "ENTITY_TYPE",
    CreationBlock: "uint256", // Set on player, rat and room
    LastVisitBlock: "uint256", // Set on room
    // ...
    Health: "uint256", // Set on rat
    Dead: "bool", // Set on rat
    // ...
    Traits: "bytes32[]", // Traits of rat
    Inventory: "bytes32[]", // Items carried by player and rat
    // ...
    Level: "bytes32", // Id of level. Set on rat and room.
    AchievedLevels: "bytes32[]", // Set on player. List of levels any of the player's rats have achieved.
    MasterKey: "bool", // Set on player. Gives access to in-game admin area.
    Index: "uint256", // Set on rat and room
    Balance: "uint256", // Amount of credits. Set on player, rat and room.
    Value: "uint256", // Set on traits and items
    CurrentRat: "bytes32", // Set on player
    PastRats: "bytes32[]", // Set on player. List of rats the player has owned.
    Owner: "bytes32", // Set on room and rat
    VisitCount: "uint256", // Set on room
    KillCount: "uint256", // Set on room
    // ...
    Prompt: "string",
    // ...
    RoomCreationCost: "uint256", // Set on level and room
    IsSpecialRoom: "bool", // Set on special rooms
    MaxValuePerWin: "uint256", // Set on special rooms
    LevelMinBalance: "uint256", // Set on level. If rat balance is below this, it will be leveled down.
    LevelMaxBalance: "uint256" // Set on level. If rat balance is above this, it will be leveled up.
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: []
    }
  ]
})
