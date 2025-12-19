// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IWorld } from "../../../src/codegen/world/IWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";

import { ManagerSystem } from "../../../src/systems/ManagerSystem.sol";

/**
 * @title RedeployManagerSystem
 * @notice Deploys a new ManagerSystem and registers it to replace the existing one
 */
contract RedeployManagerSystem is Script {
  function run(address worldAddress) external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    vm.startBroadcast(deployerPrivateKey);

    console.log("=== Redeploying ManagerSystem ===");
    console.log("World address:", worldAddress);

    // Deploy new ManagerSystem
    ManagerSystem managerSystem = new ManagerSystem();
    console.log("New ManagerSystem deployed at:", address(managerSystem));

    // Register it (replaces the existing one since publicAccess=true)
    ResourceId managerSystemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "ManagerSystem");
    console.log("ManagerSystem Resource ID:");
    console.logBytes32(ResourceId.unwrap(managerSystemResource));

    IWorld(worldAddress).registerSystem(managerSystemResource, managerSystem, true);
    console.log("ManagerSystem registered!");

    vm.stopBroadcast();

    console.log("=== Redeploy Complete ===");
    console.log("New ManagerSystem address:", address(managerSystem));
  }
}
