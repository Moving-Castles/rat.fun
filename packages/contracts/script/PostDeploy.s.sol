// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";

import { GameConfig } from "../src/codegen/index.sol";

import { LibInit, LibLevel, LibRoom } from "../src/libraries/Libraries.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // Root namespace owner is admin
    LibInit.init(NamespaceOwner.get(ROOT_NAMESPACE_ID));

    bytes32 adminId = GameConfig.getAdminId();

    // // Create levels
    bytes32 firstLevel = LibLevel.createLevel(0, 0, 1000000, 250); // Level 0

    // // Electrical shock therapy. Rat gets psychological disorder, or heals one (even if unlikely).
    LibRoom.createRoom(
      "Electrical Shock Therapy",
      "The rat gets psychological disorder, or heals one (even if unlikely).",
      adminId,
      firstLevel,
      bytes32(0)
    );

    vm.stopBroadcast();
  }
}
