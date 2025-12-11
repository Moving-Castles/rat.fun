// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { IWorld } from "../../../src/codegen/world/IWorld.sol";
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { CallWithSignatureModule } from "@dk1a/world-module-callwithsignature-alt/src/CallWithSignatureModule.sol";

contract InstallCallWithSignatureAltModule is Script {
  function run(address worldAddress) external {
    IWorld world = IWorld(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    world.installRootModule(new CallWithSignatureModule(), "");

    vm.stopBroadcast();
  }
}
