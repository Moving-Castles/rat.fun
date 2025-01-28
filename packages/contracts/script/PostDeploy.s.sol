// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IERC20Mintable } from "@latticexyz/world-modules/src/modules/erc20-puppet/IERC20Mintable.sol";
import { registerERC20 } from "@latticexyz/world-modules/src/modules/erc20-puppet/registerERC20.sol";
import { ERC20MetadataData } from "@latticexyz/world-modules/src/modules/erc20-puppet/tables/ERC20Metadata.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { StandardDelegationsModule } from "@latticexyz/world-modules/src/modules/std-delegations/StandardDelegationsModule.sol";
import { PuppetModule } from "@latticexyz/world-modules/src/modules/puppet/PuppetModule.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";

import { LibRoom, LibInit } from "../src/libraries/Libraries.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // IWorld world = IWorld(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // // Install modules
    // world.installRootModule(new StandardDelegationsModule(), new bytes(0));
    // world.installModule(new PuppetModule(), new bytes(0));

    // If a rat does not make a choice within 10 minutes it is killed and the body removed.

    // Initialize gameConfig and tutorial levels
    // Root namespace owner is admin
    LibInit.init(NamespaceOwner.get(ROOT_NAMESPACE_ID));

    // Create test rooms
    LibRoom.createRoom(
      "The room has two doors. One doors lead to victory, the other to defeat. Each door has a guardian mouse that needs to be defeated to pass."
    );
    LibRoom.createRoom(
      "The room has one door. There is a puzzle on the floor. If a rat can solve the puzzle the door will open leading to victory."
    );
    LibRoom.createRoom("The room has no doors. The room is radioactive. There is no escape.");
    LibRoom.createRoom("The room has no doors. There is a comfortable bed and relaxing music playing.");
    LibRoom.createRoom(
      "The room has a VR head set. The VR head give the experience of running on a thredmill. There is a virtual block of cheese dangling just out of reach. The experience of time is infinite."
    );
    LibRoom.createRoom(
      "The room has a VR head set. The VR head gives access to all knowledge in the world. The experience of time is infinite."
    );
    LibRoom.createRoom("The room has healing energy that will restore the rat to perfect health.");
    LibRoom.createRoom("The room gives the rat a bag of cheese.");
    LibRoom.createRoom("The rat can trade a bag of cheese for a jester hat of the same value.");
    LibRoom.createRoom("The rat is forced to bet it's whole credit balance on a double or nothing game of chance.");
    LibRoom.createRoom("The room gives the rat a powerful lucky charm.");
    
    vm.stopBroadcast();
  }
}
