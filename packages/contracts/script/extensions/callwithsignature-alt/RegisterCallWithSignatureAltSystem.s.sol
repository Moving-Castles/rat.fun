// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { IWorld } from "../../../src/codegen/world/IWorld.sol";
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { CallWithSignatureSystem } from "@dk1a/world-module-callwithsignature-alt/src/CallWithSignatureSystem.sol";
import { DELEGATION_SYSTEM_ID } from "@dk1a/world-module-callwithsignature-alt/src/constants.sol";

contract RegisterCallWithSignatureAltSystem is Script {
  function run(address worldAddress) external {
    IWorld world = IWorld(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // Upgrade the system
    world.registerSystem(DELEGATION_SYSTEM_ID, new CallWithSignatureSystem(), true);

    vm.stopBroadcast();
  }
}
