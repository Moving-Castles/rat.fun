import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "ratroom",
  enums: {
    ENTITY_TYPE: ["NONE", "PLAYER", "RAT", "ROOM", "ITEM", "TRAIT", ],
  },
  deploy: {
    upgradeableWorldImplementation: true,
  },
  tables: {
    GameConfig: {
      key: [],
      schema: {
        adminAddress: "address",
        globalRoomIndex: "uint32",
        globalRatIndex: "uint32",
        roomCreationCost: "uint32",
        maxRoomPromptLength: "uint32",
        maxInventorySize: "uint32",
        maxLoadOutSize: "uint32",
        maxTraitsSize: "uint32",
      },
      codegen: {
        dataStruct: true
      }
    },
    Name: "string",
    EntityType: "ENTITY_TYPE",
    // ...
    Health: "uint256",
    Dead: "bool",
    // ...
    Traits: "bytes32[]",
    Inventory: "bytes32[]",
    // ...
    Level: "uint256",
    Balance: "uint256",
    Value: "int256", // Value of a trait can be negative
    OwnedRat: "bytes32",
    Owner: "bytes32",
    RoomPrompt: "string",
    Index: "uint256"
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: [],
    }
  ],
});
