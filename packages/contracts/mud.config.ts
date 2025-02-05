import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "ratroom",
  enums: {
    ENTITY_TYPE: ["NONE", "PLAYER", "RAT", "ROOM", "ITEM", "TRAIT", ],
    ROOM_TYPE: ["ONE_PLAYER", "TWO_PLAYER"]
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
        roomCreationCost: "uint32",
        maxRoomPromptLength: "uint32",
        maxInventorySize: "uint32",
        maxLoadOutSize: "uint32",
        maxTraitsSize: "uint32",
        creatorFee: "uint256",
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
    Index: "uint256",
    Balance: "uint256",
    WaitingInRoom: "bytes32", // Set on rat. Id of the room that the rat is waiting in
    Value: "int256", // Value of a trait can be negative
    OwnedRat: "bytes32",
    Owner: "bytes32",
    // ...
    RoomPrompt: "string",
    RoomType: "ROOM_TYPE",
    RatInRoom: "bytes32" // Set on room. Id of rat waiting in room
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: [],
    }
  ],
});
