// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IWorld } from "../../../src/codegen/world/IWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";

/**
 * @title RegisterManagerSystemSelectors
 * @notice Registers the ManagerSystem function selectors
 * @dev Use this if ManagerSystem was registered but function selectors are missing
 */
contract RegisterManagerSystemSelectors is Script {
  function run(address worldAddress) external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    vm.startBroadcast(deployerPrivateKey);

    console.log("=== Registering ManagerSystem function selectors ===");
    console.log("World address:", worldAddress);

    ResourceId managerSystemResource = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratfun", "ManagerSystem");
    console.log("ManagerSystem Resource ID:");
    console.logBytes32(ResourceId.unwrap(managerSystemResource));

    // Register applyOutcome - Item struct expands to (string,uint256)
    IWorld(worldAddress).registerFunctionSelector(
      managerSystemResource,
      "applyOutcome(bytes32,bytes32,int256,bytes32[],(string,uint256)[])"
    );
    console.log("applyOutcome function selector registered!");

    // Register other ManagerSystem functions that may be missing
    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "giveMasterKey(bytes32)");
    console.log("giveMasterKey function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setWorldEvent(string,string,string,uint256)");
    console.log("setWorldEvent function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "removeWorldEvent()");
    console.log("removeWorldEvent function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setCooldownCloseTrip(uint32)");
    console.log("setCooldownCloseTrip function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setRatsKilledForAdminAccess(uint32)");
    console.log("setRatsKilledForAdminAccess function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setMaxValuePerWin(uint32)");
    console.log("setMaxValuePerWin function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setMinRatValueToEnter(uint32)");
    console.log("setMinRatValueToEnter function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setTaxationLiquidateRat(uint32)");
    console.log("setTaxationLiquidateRat function selector registered!");

    IWorld(worldAddress).registerFunctionSelector(managerSystemResource, "setTaxationCloseTrip(uint32)");
    console.log("setTaxationCloseTrip function selector registered!");

    vm.stopBroadcast();

    console.log("=== All ManagerSystem selectors registered ===");
  }
}
