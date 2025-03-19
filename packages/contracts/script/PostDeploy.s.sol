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

import { LibRoom, LibInit, LibUtils, LibLevel } from "../src/libraries/Libraries.sol";

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

    // Initialize gameConfig and tutorial levels
    // Root namespace owner is admin
    LibInit.init(NamespaceOwner.get(ROOT_NAMESPACE_ID));

    bytes32 adminId = GameConfig.getAdminId();

    // prettier-ignore

    // Create levels
    bytes32 firstLevel = LibLevel.createLevel(0, 100, 100); // Level 0
    bytes32 secondLevel = LibLevel.createLevel(1, 100, 100); // Level 1
    LibLevel.createLevel(2, 200, 200); // Level 2
    LibLevel.createLevel(3, 300, 300); // Level 3
    LibLevel.createLevel(4, 400, 400); // Level 4
    LibLevel.createLevel(5, 500, 500); // Level 5

    // Level 1
    LibRoom.createRoom("Fight", "There is a second rat in the room. The rats have to fight.", adminId, firstLevel);
    LibRoom.createRoom(
      "Magic hospital",
      "The room has healing energy that will restore the rat to perfect health.",
      adminId,
      firstLevel
    );
    LibRoom.createRoom("Cheese", "The room gives the rat a bag of cheese.", adminId, firstLevel);
    LibRoom.createRoom(
      "Trade",
      "The rat can trade a bag of cheese for a jester hat of the same value.",
      adminId,
      firstLevel
    );
    LibRoom.createRoom("Sell", "The rat can sell a jester hat.", adminId, firstLevel);
    LibRoom.createRoom(
      "Bet",
      "The rat is forced to bet it's whole credit balance on a double or nothing game of chance.",
      adminId,
      firstLevel
    );
    LibRoom.createRoom("Hot dog", "Hot dog eating contest", adminId, firstLevel);
    LibRoom.createRoom("Kill", "The room is a euthanasia chamber. There is no exit.", adminId, firstLevel);

    // Level 2
    LibRoom.createRoom("Forced Swim Test", "Forced Swim Test", adminId, secondLevel);
    LibRoom.createRoom(
      "Aggression",
      "The room is filled with a gas that increases rat aggression.",
      adminId,
      secondLevel
    );

    vm.stopBroadcast();
  }
}
