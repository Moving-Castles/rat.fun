import { defineWorld } from "@latticexyz/world";

// @todo: import enums from external file
// import { ENTITY_TYPE_ARRAY } from "./enums";
// const enums = {
//   ENTITY_TYPE: ENTITY_TYPE_ARRAY
// }

export default defineWorld({
  namespace: "ratroom",
  enums: {
    ENTITY_TYPE: ["NONE", "PLAYER", "BRAIN"],
  },
  deploy: {
    upgradeableWorldImplementation: true,
  },
  tables: {
    // Name: "string",
    EntityType: "ENTITY_TYPE",
    Brain: {
      key: ["playerId"],
      schema: {
        playerId: "bytes32",
        traitA: "uint32",
        traitB: "uint32",
        traitC: "uint32",
        traitD: "uint32",
      },
    },
    Counter: "uint32"
    // Event: {
    //   key: ["playerId"],
    //   type: "offchainTable",
    //   schema: {
    //     playerId: "bytes32",
    //     blockNumber: "uint256"
    //   },
    // },
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
