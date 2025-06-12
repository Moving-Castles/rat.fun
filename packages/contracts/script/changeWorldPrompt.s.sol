// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";

import { GameConfig, LevelList } from "../src/codegen/index.sol";

import { LibWorld } from "../src/libraries/Libraries.sol";

contract ChangeWorldPrompt is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // Set world prompt
    // Heating systems are broken: -5C/23F in all rooms.
    // Heating system is working in overdrive: +25C/77F in all rooms.
    LibWorld.setWorldPrompt("Heating system is working in overdrive: +25C/77F in all rooms.");

    vm.stopBroadcast();
  }
}
