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

    // Create levels
    bytes32 firstLevel = LibLevel.createLevel(0, "", 0, 200, 250); // Level 0
    bytes32 secondLevel = LibLevel.createLevel(1, "Floor is underwater", 200, 500, 250); // Level 1
    bytes32 thirdLevel = LibLevel.createLevel(2, "Floor is cold", 500, 1000, 250); // Level 2
    bytes32 fourthLevel = LibLevel.createLevel(3, "Floor is hot", 1000, 2000, 250); // Level 3
    bytes32 fifthLevel = LibLevel.createLevel(4, "Floor is lava", 2000, 300000, 250); // Level 4

    // Electrical shock therapy. Rat gets psychological disorder, or heals one (even if unlikely).
    LibRoom.createRoom(
      "The rat gets psychological disorder, or heals one (even if unlikely).",
      adminId,
      firstLevel,
      bytes32(0)
    );

    vm.stopBroadcast();
  }
}
