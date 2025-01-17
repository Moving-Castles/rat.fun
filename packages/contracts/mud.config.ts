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
      },
      codegen: {
        dataStruct: true
      }
    },
    Name: "string",
    EntityType: "ENTITY_TYPE",
    // Stats
    Health: "uint256",
    Level: "uint256",
    // Inventory
    Traits: "bytes32[]",
    // ...
    Dead: "bool",
    Balance: "uint256",
    OwnedRat: "bytes32",
    Owner: "bytes32",
    RoomPrompt: "string",
    RoomIndex: "uint256"
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: [],
    },
    {
      artifactPath: "@latticexyz/world-modules/out/Unstable_CallWithSignatureModule.sol/Unstable_CallWithSignatureModule.json",
      root: true,
      args: [],
    }
  ],
});
