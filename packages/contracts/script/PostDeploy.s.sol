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

import { GameConfig } from "../src/codegen/index.sol";

import { LibRoom, LibInit, LibUtils } from "../src/libraries/Libraries.sol";
import { ROOM_TYPE } from "../src/codegen/common.sol";

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

    bytes32 adminId = GameConfig.getAdminId();

    // Create test rooms
    LibRoom.createRoom("There is a second rat in the room. The rats have to fight.", ROOM_TYPE.ONE_PLAYER, adminId);
    LibRoom.createRoom("The room has a comfortable bed and relaxing music playing.", ROOM_TYPE.ONE_PLAYER, adminId);
    LibRoom.createRoom(
      "The room has healing energy that will restore the rat to perfect health.",
      ROOM_TYPE.ONE_PLAYER,
      adminId
    );
    LibRoom.createRoom("The room gives the rat a bag of cheese.", ROOM_TYPE.ONE_PLAYER, adminId);
    LibRoom.createRoom(
      "The rat can trade a bag of cheese for a jester hat of the same value.",
      ROOM_TYPE.ONE_PLAYER,
      adminId
    );
    LibRoom.createRoom(
      "The rat is forced to bet it's whole credit balance on a double or nothing game of chance.",
      ROOM_TYPE.ONE_PLAYER,
      adminId
    );
    LibRoom.createRoom("The room gives the rat a powerful lucky charm.", ROOM_TYPE.ONE_PLAYER, adminId);
    LibRoom.createRoom("The room is a euthanasia chamber. There is no exit.", ROOM_TYPE.ONE_PLAYER, adminId);
    LibRoom.createRoom("The neutral room.", ROOM_TYPE.TWO_PLAYER, adminId);
    LibRoom.createRoom(
      "The room has is filled with a gas that radically increases rat aggression.",
      ROOM_TYPE.TWO_PLAYER,
      adminId
    );

    vm.stopBroadcast();
  }
}
