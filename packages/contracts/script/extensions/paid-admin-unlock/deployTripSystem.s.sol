// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { IWorld } from "../../../src/codegen/world/IWorld.sol";
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

// Create resource identifiers (for the namespace and system)
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";

// For deploying systems
import { TripSystem } from "../../../src/systems/TripSystem.sol";

contract DeployTripSystem is Script {
  function run(address worldAddress) external {
    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    ResourceId systemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "TripSystem");

    vm.startBroadcast(deployerPrivateKey);

    TripSystem tripSystem = new TripSystem();
    console.log("TripSystem address: ", address(tripSystem));

    IWorld(worldAddress).registerSystem(systemResource, tripSystem, true);
    IWorld(worldAddress).registerFunctionSelector(systemResource, "addTripBalance(bytes32,uint256)");

    vm.stopBroadcast();
  }
}
