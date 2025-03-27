import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "ratroom",
  enums: {
    ENTITY_TYPE: ["NONE", "PLAYER", "RAT", "ROOM", "ITEM", "TRAIT", "LEVEL" ]
  },
  deploy: {
    upgradeableWorldImplementation: true,
  },
  tables: {
    GameConfig: {
      key: [],
      schema: {
        adminAddress: "address",
        adminId: "bytes32",
        globalRoomIndex: "uint32",
        globalRatIndex: "uint32",
        maxRoomPromptLength: "uint32",
        maxInventorySize: "uint32",
        maxTraitsSize: "uint32",
        creatorFee: "uint256"
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
    // ...
    Name: "string", // Set on player, rat and room
    EntityType: "ENTITY_TYPE",
    CreationBlock: "uint256", // Set on player, rat and room
    // ...
    Health: "uint256", // Set on rat
    Dead: "bool", // Set on rat
    // ...
    Traits: "bytes32[]", // Traits of rat
    Inventory: "bytes32[]", // Items carried by player and rat
    // ...
    Level: "bytes32", // Id of level. Set on rat and room.
    Index: "uint256", // Set on rat and room
    Balance: "uint256", // Amount of credits. Set on player, rat and room.
    Value: "int256", // Value of a trait can be negative
    OwnedRat: "bytes32", // Set on player
    Owner: "bytes32", // Set on room and rat
    VisitCount: "uint256", // Set on room
    KillCount: "uint256", // Set on room
    // ...
    RoomPrompt: "string",
    // ...
    RoomCreationCost: "uint256",
    LevelUpCost: "uint256"
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: [],
    }
  ],
});
