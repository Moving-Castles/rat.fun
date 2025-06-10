// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";

import { GameConfig } from "../src/codegen/index.sol";

import { LibWorld, LibLevel, LibRoom } from "../src/libraries/Libraries.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    bytes32 adminId = GameConfig.getAdminId();

    // Create levels
    bytes32[] memory levels = new bytes32[](5);
    levels[0] = LibLevel.createLevel(0, "Freezer", "Floor temperature is -5 degrees celsius.", 0, 250, 250);
    levels[1] = LibLevel.createLevel(
      1,
      "Dark ages",
      "Floor is stuck in the dark ages, only items and rooms that could have existed in the medieval period are functional / exist on this floor.",
      250,
      500,
      500
    );
    levels[2] = LibLevel.createLevel(2, "Water world", "Floor is completely underwater.", 500, 1000, 1000);
    levels[3] = LibLevel.createLevel(
      3,
      "Demon town",
      "Floor is haunted by demons that speak to the rats and try to drive them to insanity.",
      1000,
      2500,
      2500
    );
    levels[4] = LibLevel.createLevel(4, "Fire", "Floor is on literal fire.", 2500, 10000, 10000);

    // Root namespace owner is admin
    LibWorld.init(NamespaceOwner.get(ROOT_NAMESPACE_ID), levels);

    // Set world prompt
    LibWorld.setWorldPrompt("Heating systems are broken: -5C/23F in all rooms.");

    // Electrical shock therapy. Rat gets psychological disorder, or heals one (even if unlikely).
    // LibRoom.createRoom(
    //   "The rat gets psychological disorder, or heals one (even if unlikely).",
    //   adminId,
    //   levels[0],
    //   bytes32(0)
    // );

    vm.stopBroadcast();
  }
}
