// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

// Create resource identifiers (for the namespace and system)
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

contract VerifyManagerSystem is Script {
  function run(address worldAddress) external {
    StoreSwitch.setStoreAddress(worldAddress);

    ResourceId systemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "ManagerSystem");

    (address systemAddress, bool publicAccess) = Systems.get(systemResource);

    console.log("World address:", worldAddress);
    console.logBytes32(ResourceId.unwrap(systemResource));
    console.log("ManagerSystem address:", systemAddress);
    console.log("Public access:", publicAccess);
  }
}
